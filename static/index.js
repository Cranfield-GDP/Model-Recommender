const chatBody = document.getElementById('chat-body');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
let chosenModel;
let selectedCategory;
let deploymentType;
let selectedSlice;

let selectedNeeds = {
    latency: null,
    numberOfDevices: null,
    inputBandWidth: null
};

function appendMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    messageDiv.textContent = content;
    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}


let buttonContent = 'Below are the list of model that suits your requirement <br />';
buttonContent += 'All models performs equally good<br />';
buttonContent += 'Choose a model that you prefer <br /><br />';


function appendButton(list, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('btn', sender);
    messageDiv.innerHTML = buttonContent;
    list.forEach(element => {
        const button = document.createElement('button');
        button.textContent = element;
        button.addEventListener('click', handleButtonClick);
        messageDiv.appendChild(button);
    });
    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}
appendMessage('I can suggest you best suited models for your AI application, Provide your detailed requirement', 'bot')

function toggleInput(disabled) {
    chatInput.disabled = disabled;
    sendBtn.disabled = disabled;
}

sendBtn.addEventListener('click', () => {
    const userMessage = chatInput.value.trim();
    if(userMessage.toLowerCase() == "confirm" && chosenModel && selectedNeeds.latency){
        sendRequestToCreateServer(userMessage);
    } else if (userMessage) {
        sendUserRequirement(userMessage, "/chat/model");
    }
});

chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendBtn.click();
    }
});

function handleButtonClick(event) {
    const parentDiv = event.target.parentElement;
    const allButtons = parentDiv.querySelectorAll('button');

    allButtons.forEach(button => {
        button.disabled = true;
        button.style.backgroundColor = '#008CBA'; 
        button.style.color = 'white'; 
    });

    const clickedButton = event.target;
    clickedButton.style.backgroundColor = '#4CAF50'; 
    clickedButton.style.color = 'white'; 

    const selectedModel = clickedButton.textContent;
    chosenModel = selectedModel;
    askForNeeds();
}

function askForNeeds() {
    appendMessage('Please select your deployment requirements:', 'bot');

    const needsContainer = document.createElement('div');
    needsContainer.classList.add('needs-container');

    const options = {
        latency: ['<10ms', '>10ms', '>50ms', '>100ms'],
        numberOfDevices: ['<100', '>100', '>1000'],
        inputBandWidth: ['<1mbps', '<10mbps', '<100mbps', '<500mbps']
    };

    // Create a section for each need
    Object.keys(options).forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.classList.add('need-category');
        const title = document.createElement('h4');
        title.textContent = category;
        categoryDiv.appendChild(title);

        options[category].forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.addEventListener('click', () => {
                selectedNeeds[category] = option;
                const siblingButtons = categoryDiv.querySelectorAll('button');
                siblingButtons.forEach(btn => {
                    btn.disabled = true;
                    btn.style.backgroundColor = '#008CBA';
                    btn.style.color = 'white';
                });
                button.style.backgroundColor = '#4CAF50';
                button.style.color = 'white';

                if (selectedNeeds.latency && selectedNeeds.numberOfDevices && selectedNeeds.inputBandWidth) {
                    sendDeploymentRequest();
                }
            });
            categoryDiv.appendChild(button);
        });

        needsContainer.appendChild(categoryDiv);
    });

    chatBody.appendChild(needsContainer);
    chatBody.scrollTop = chatBody.scrollHeight;
}


const sendRequestToCreateServer = (confirmation) =>{
    appendMessage(confirmation, 'user');
    chatInput.value = '';
    toggleInput(true);
    fetch('/build-server', {
        method: 'POST',
        headers: {
           'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
            model: chosenModel, 
            category: selectedCategory, 
            deploymentType: deploymentType, 
            networkSlice: selectedSlice
        })
    }).then(() => {
        appendMessage('Preparing server and will be notified once done', 'bot');
    }).catch((error) => {
        console.log(error);
        appendMessage('Error from server, Provide the requirement once again', 'bot');
        toggleInput(false);
    });
}

const sendUserRequirement = (requirement, endPoint) =>{
    appendMessage(requirement, 'user');
    chatInput.value = '';
    toggleInput(true);
    fetch(endPoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: requirement })
    })
        .then(response => response.json()) 
        .then(data => {
            if(data.models && data.category){
                selectedCategory = data.category;
                appendButton(data.models, 'bot');
            }else if (data.message) {
                appendMessage(data.message.trim(), 'bot'); 
            } else {
                appendMessage('No response from server.', 'bot');
            }
        })
        .catch((error) => {
            console.log(error);
            appendMessage('Error connecting to the server.', 'bot');
        })
        .finally(() => {
            toggleInput(false);
        });
};

function sendDeploymentRequest() {
    const payload = {
        ...selectedNeeds
    };

    appendMessage('Deploying server with your selected requirements...', 'bot');
    toggleInput(true);

    fetch('/chat/deployment', {
        method: 'POST',
        headers: {
           'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
    }).then(response => response.json())
      .then(data => {
        if(data.deployment && data.networkSlice){
            deploymentType = data.deployment
            selectedSlice = data.networkSlice
            appendMessage(`Please type "CONFIRM" to deploy the model in "${data.deployment}" utilizing "${data.networkSlice}" network slice`, "bot");
        }else{
            appendMessage("An error in determining the deployment type of the model", "bot")
        }
      })
      .catch(error => {
          console.log(error);
          appendMessage('Error deploying server. Please try again.', 'bot');
      })
      .finally(() => {
          toggleInput(false);
      });
}