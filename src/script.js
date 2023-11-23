const submit = document.getElementById("submit");
const logout = document.getElementById("logout");
const loginSection = document.getElementById("data-form");
const mainSection = document.getElementById("main");
const feedback = document.getElementById("feedback");
const apiUrl = 'https://01.kood.tech/api/graphql-engine/v1/graphql';
let headers ={}; 
let events = {};
let moduls = [];

function handelSubmitbutton (event) {
    event.preventDefault();
    // Get user inputs
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    // Check if inputs are valid (you can add more validation as needed)
    if (!username || !password) {
        feedback.innerText = "Please fill in all fields.";
        return;
    }
    // Create a data object for Basic Authentication
    const basicAuth = btoa(`${username}:${password}`);
    // Define the URL of the endpoint to obtain JWT
    const jwtEndpoint = "https://01.kood.tech/api/auth/signin"; // Replace with the actual URL
    // Make a POST request to obtain the JWT token
    fetch(jwtEndpoint, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${basicAuth}`,
            "Content-Type": "application/json"
        },
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw (response);
        }
    })
    .then(responseData => {
        // JWT token returned
        makeCookie(responseData); 
        feedback.innerText = "SUCCESS";
        submit.removeEventListener("click", handelSubmitbutton);
        mainFunction();
    })
    .catch( response => {
        response.json().then((res) => {
            feedback.innerText = `Error: ${res.error}`;
        })
    });
}
function loginButtonActive() {
    submit.addEventListener("click", handelSubmitbutton);
}

function handleLogOut(){
    clearAll(true); 
    deleteCookie();
    loginButtonActive();
    location.reload();
}

function logoutButtomActive() {
    logout.addEventListener("click", handleLogOut);
}

function isJWT(token) {
    const jwtRegex = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/;
    return jwtRegex.test(token);
  }

function makeCookie(JWTToken) {
    if (isJWT(JWTToken)) {
        document.cookie = "JWTToken" + "=" + JWTToken + ";";
    } else {
        document.cookie = "JWTToken" + "=" + undefined + ";";
    }
}

function deleteCookie() {
    document.cookie = "JWTToken =; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    // something with front end
}

function checkCookie() {
    const decodedCookie = decodeURIComponent(document.cookie);
    JWTToken = decodedCookie.replace("JWTToken=","");
    if (JWTToken === "undefined") {
        return null
    } else {
        return JWTToken;
    }
}


function mainFunction() { // checkes if the token exists then does stuff
    JWTToken = checkCookie();
    if (JWTToken) {
        logoutButtomActive(); 
        loginSection.style.display ="none";
        mainSection.style.display ="flex";
        headers = {
            'Authorization': `Bearer ${JWTToken}`,
            'Content-Type': 'application/json',
            };
        getListOfModuls();
        getUserName(); 
        // populate the page
    } else {
        loginButtonActive()
        // login page
    }
}

mainFunction();
let selectedModule ="";


function getUserName() {
    // Your GraphQL query
    const graphqlQuery = `
        {
            user {
                login
                email
            }
        }
    `;
    const requestBody = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ query: graphqlQuery }),
    };
    fetch(apiUrl, requestBody)
    .then(response => response.json())
    .then(data => {
    // Handle the GraphQL response data here
        let generalInfo = document.getElementById("general-info");
        let email = document.createElement("p");
        email.textContent = data.data.user[0].email;
        let login = document.createElement("h3");
        login.textContent = data.data.user[0].login;
        generalInfo.appendChild(email);
        generalInfo.appendChild(login);
    })
    .catch(error => {
    // Handle any errors that occur during the request
    handleLogOut();
    });
}

function getListOfModuls () {

    // Your GraphQL query
    const graphqlQuery = `
        {
            result (distinct_on: eventId) {
            event {
                id
                pathByPath {
                path
                }
            }
            }
        }
    `;

    // Define the GraphQL request payload
    const requestBody = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ query: graphqlQuery }),
    };
    fetch(apiUrl, requestBody)
    .then(response => response.json())
    .then(data => {
    // Handle the GraphQL response data here
        data.data.result.pop(); // take off the null one in the
        data.data.result.forEach(element => { // can be done recursively but need a lot of work too lazy 
            if (element.event.pathByPath.path.split('/').length -1 === 2) {
                let value = element.event.pathByPath.path.split('/')[2];
                moduls.push(value); 
                if (!events.hasOwnProperty(`${value}`)) {
                    events[value] = [];
                }
                events[value].push(element.event.id);
            } else {
                if (element.event.pathByPath.path.split('/')[2] === "div-01") {
                    if(element.event.pathByPath.path.split('/').length -1 === 3) {
                        let value = element.event.pathByPath.path.split('/')[3]; 
                        moduls.push(value);
                        if (!events.hasOwnProperty(`${value}`)) {
                            events[value] = [];
                        }
                        events[value].push(element.event.id);
                    } else {
                        events[element.event.pathByPath.path.split('/')[3]].push(element.event.id);
                    }
                } else {
                    events[element.event.pathByPath.path.split('/')[2]].push(element.event.id);
                }
            } ;
        });
        var container = document.getElementById("modules");
        moduls.forEach ( function (module) {
            // Create the radio button element
            var radioBtn = document.createElement("input");
            radioBtn.type = "radio";
            radioBtn.name = "module";
            radioBtn.id = module.toLowerCase();
            radioBtn.value = module;

            // Create the label element for the radio button
            var label = document.createElement("label");
            label.htmlFor = module.toLowerCase();
            label.appendChild(document.createTextNode(module));

            // Add the radio button and label to the container
            container.appendChild(radioBtn);
            container.appendChild(label);
        }
        )
        if (moduls.length > 0) {
            var radioButtons = document.querySelectorAll('input[name="module"]');

            // Add an event listener to each radio button
            radioButtons.forEach(function(radioButton) {
                radioButton.addEventListener('change', function() {
                    // Get the value of the selected radio button
                    selectedModule = this.value;
                    // change the values
                    updateAll(selectedModule);
                });
            });
        }
    })
    .catch(error => {
    // Handle any errors that occur during the request
    handleLogOut(); 
    });
}

function updateAll (module) {
    clearAll(false);
        // Your GraphQL query
    updateXp(module);
    updateAudit(module);
    updateGraphs(module);
}

function clearAll(mode) {
    if (mode) { // if true cleans all
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        username.value="";
        password.value="";
        deleteChildElements("general-info");
        deleteChildElements("modules");

    }
    deleteChildElements("XP-total"); 
    deleteChildElements("Audit");
    deleteChildElements("graph1");
    deleteChildElements("graph2");
}

function deleteChildElements(parentId) {
    var parent = document.getElementById(parentId);
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function updateXp(module) {
    const graphqlQuery = `
    {
        transaction_aggregate (where: {eventId: {_in: [${events[module]}]}, type: {_eq: "xp"}}) {
            aggregate {
                sum {
                    amount
                }
            }
        }
    }
    `;
    const requestBody = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ query: graphqlQuery }),
    };
    fetch(apiUrl, requestBody)
    .then(response => response.json())
    .then(data => {
    // Handle the GraphQL response data here
        let element= document.getElementById("XP-total");
        let intro = document.createElement("p");
        intro.innerText = "Total XP in: " + module;
        let number = document.createElement("h3");
        number.textContent = data.data.transaction_aggregate.aggregate.sum.amount/1000 + "MB";
        element.appendChild(intro);
        element.appendChild(number);
    })
    .catch(error => {
    // Handle any errors that occur during the request
    handleLogOut();
    });
}

function updateAudit(module) {
    const graphqlQuery = `
    {
        transaction_aggregate (where: {eventId: {_in: [${events[module]}]}, type: {_eq: "up"}}) {
            aggregate {
                sum {
                    amount
                }
            }
        }
    }
    `;
    const graphqlQuery2 = `
    {
        transaction_aggregate (where: {eventId: {_in: [${events[module]}]}, type: {_eq: "down"}}) {
            aggregate {
                sum {
                    amount
                }
            }
        }
    }
    `;
    const requestBody = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ query: graphqlQuery }),
    };
    fetch(apiUrl, requestBody)
    .then(response => response.json())
    .then(data => {
    // Handle the GraphQL response data here
        let element= document.getElementById("Audit");
        let intro = document.createElement("p");
        intro.innerText = "Audit done in: " + module;
        let number = document.createElement("h3");
        number.textContent = data.data.transaction_aggregate.aggregate.sum.amount/1000 + "MB";
        element.appendChild(intro);
        element.appendChild(number);
    })
    .catch(error => {
    // Handle any errors that occur during the request
    handleLogOut();
    });
    const requestBody2 = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ query: graphqlQuery2 }),
    };
    fetch(apiUrl, requestBody2)
    .then(response => response.json())
    .then(data => {
    // Handle the GraphQL response data here
        let element= document.getElementById("Audit");
        let intro = document.createElement("p");
        intro.innerText = "Audit received in: " + module;
        let number = document.createElement("h3");
        number.textContent = data.data.transaction_aggregate.aggregate.sum.amount/1000 + "MB";
        element.appendChild(intro);
        element.appendChild(number);
    })
    .catch(error => {
    // Handle any errors that occur during the request
    handleLogOut();
    });
}

function updateGraphs(module) {
    const graphqlQuery = `
    {
        transaction(where: {eventId: {_in: [${events[module]}]}, type: {_eq: "xp"}}, order_by: {createdAt: asc}) {
            createdAt
            amount
            object{
                name
            }
        }
    }
    `;
    const requestBody = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ query: graphqlQuery }),
    };
    fetch(apiUrl, requestBody)
    .then(response => response.json())
    .then(data => {
    // Handle the GraphQL response data here
        let timeData = data.data.transaction;
        timeData.forEach(item => {
            item.createdAt = new Date(item.createdAt);
          });
        let cumSum = 0;
        let timeDataCleaned;
        let minDate= timeData[0].createdAt;
        let maxDate= timeData[timeData.length-1].createdAt;
        if ((maxDate-minDate)/(1000*60*60*24)>60){
            // initialize the array
            let init= {}; 
            while (minDate <= maxDate) {
                const year = minDate.getFullYear();
                const month = minDate.getMonth();
                const key = `${year}-${month}`;
                init[key] = { sum: 0, count: 0, cumSum: 0, names: [], lable: `${minDate.toLocaleString('default', { month: 'short' })} ${year}`};
                if (month === 11 ) {
                    minDate.setFullYear(year + 1);
                    minDate.setMonth(0);
                } else {
                    minDate.setMonth(month+1);
                }
              }
            //
            timeDataCleaned = timeData.reduce((result, item) => {
                const year = item.createdAt.getFullYear();
                const month = item.createdAt.getMonth();
                const key = `${year}-${month}`;
                if (!result[key]) {
                    result[key] = { sum: 0, count: 0, cumSum: cumSum, names: [], lable:  `${item.createdAt.toLocaleString('default', { month: 'short' })} ${year}`};
                }
                cumSum+= item.amount;
                result[key].cumSum= cumSum;
                result[key].sum += item.amount;
                result[key].count++;
                result[key].names.push(item.object.name); 
                return result;
            }, init);
            // make the series complete


        } else {
            let init= {}; 
            while (minDate <= maxDate) {
                const year = minDate.getFullYear();
                const month = minDate.getMonth();
                const day = minDate.getDate();
                const key = `${year}-${month}-${day}`;
                init[key] = { sum: 0, count: 0, cumSum: 0, names: [], lable: `${day} ${minDate.toLocaleString('default', { month: 'short' })}`};
                minDate.setDate(day+1)
              }
            timeDataCleaned = timeData.reduce((result, item) => {
                const year = item.createdAt.getFullYear();
                const month = item.createdAt.getMonth();
                const day = item.createdAt.getDate();
                const key = `${year}-${month}-${day}`;
                if (!result[key]) {
                    result[key] = { sum: 0, count: 0, cumSum: cumSum, names: [], lable: `${day} ${item.createdAt.toLocaleString('default', { month: 'short' })}`};
                }
                cumSum+= item.amount;
                result[key].cumSum= cumSum;
                result[key].sum += item.amount;
                result[key].count++;
                result[key].names.push(item.object.name); 
                return result;
            }, init);
        }
        dataCleanedMap = Object.values(timeDataCleaned); 
        for (i = 1; i<dataCleanedMap.length; i++) {
            if(dataCleanedMap[i].cumSum == 0 ) {
                dataCleanedMap[i].cumSum = dataCleanedMap[i-1].cumSum; 
            }
        }
        const graphData = {
            labels: dataCleanedMap.flatMap(item => item.lable),
            datasets: [
                {
                    name: "Added XP", chartType: "bar",
                    values: dataCleanedMap.flatMap(item => item.sum)
                },
                {
                    name: "Total XP", chartType: "line",
                    values: dataCleanedMap.flatMap(item => item.cumSum)
                }
            ]
        }
        const graphData2 = {
            labels: dataCleanedMap.flatMap(item => item.lable),
            datasets: [
                {
                    name: "N Task", chartType: "bar",
                    values: dataCleanedMap.flatMap(item => item.count)
                }
            ]
        }
        
        const chart = new frappe.Chart("#graph1", {  // or a DOM element,
                                                    // new Chart() in case of ES6 module with above usage
            title: "Total XP per month and cumulative sum of it",
            data: graphData,
            type: 'axis-mixed', // or 'bar', 'line', 'scatter', 'pie', 'percentage'
            height: 250,
            colors: ['#7cd6fd', '#743ee2']
        })
        const chart2 = new frappe.Chart("#graph2", {  // or a DOM element,
            // new Chart() in case of ES6 module with above usage
        title: "Number of tasks done each month",
        data: graphData2,
        type: 'axis-mixed', // or 'bar', 'line', 'scatter', 'pie', 'percentage'
        height: 250,
        colors: ['#7cd6fd', '#743ee2']
        })

    })
    .catch(error => {
    // Handle any errors that occur during the request
    handleLogOut();
    });
}