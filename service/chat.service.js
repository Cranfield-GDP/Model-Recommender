const axios = require("axios");
const HUGGING_FACE_KEY = process.env.HUGGING_FACE_KEY

const { GoogleGenerativeAI } =  require('@google/generative-ai');
const { json } = require("express/lib/response");
const res = require("express/lib/response");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const HUGGING_FACE_URL = process.env.HUGGING_FACE_API;

const task = {};


async function chatWithGeminiAndGetAppropriateModel(userRequirement){
    try{
        if(!task['categories']){
            task['categories'] = new Set(await getHuggingFaceCategories());
        }
        const categories = task["categories"];
        const prompt = getPromptForRequirement(userRequirement, categories);
        const response = await getCategoryFromGemini(prompt)
        const category = checkAndGetCategory(response, categories);
        const models = await getHuggingFaceModels(category);
        return {models: models, category: category};
    } catch (error) {
        console.error('Error in chatWithGemini:', error);
        throw error;
      } 
}

async function chatWithGeminiAndGetAppropriateDeploymentType(latency, noOfDevices, inputBandWidth){
    const prompt = getPromptForDeploymentType(latency, noOfDevices, inputBandWidth)
    const response = await model.generateContent(prompt);
    return validateAndGetDeployment(response);

}

async function getCategoryFromGemini(prompt) {
    const result = await model.generateContent(prompt);
    console.debug(result.response.candidates[0].content.parts[0].text);
    const resultCategory = result.response.candidates[0]?.content?.parts[0]?.text;

    if (!resultCategory) {
        console.error("An error in getting message from Gemini");
        throw new Error("No response received from Gemini");
    }
    return resultCategory;
}

function getPromptForRequirement(userRequirement, categories) {
    let prompt = "Help the user to choose the appropriate and most relevant category from Hugging Face Tasks for the user's requirement";
    prompt = prompt + "\nThe user's requirement is \n'";
    prompt = prompt + userRequirement;
    prompt = prompt + "'\nSelect the best suited category from the categories listed below, don't generate unnecessary explaination. Provide the category as it is listed";
    prompt = prompt + "Below are the list of available categories: \n";
    prompt = prompt + Array.from(categories).join(' ');
    return prompt;
}

function getPromptForDeploymentType(latency, noOfDevices, inputBandWidth){
    let prompt = "You are an expert deployement advisor for ML-based applications.";
    prompt += "Based on the following user requirements, decide whether the deployment should be on the cloud or edge devices";
    prompt += "Also suggest the appropriate network slice for the user based on the requirement\n";
    prompt += "Below is the user's requirement\n";
    prompt += `Latency of the server should be ${latency}, the total number of devices connected will be ${noOfDevices} and the input data will consume a bandwidth of ${inputBandWidth}`;
    prompt += "Provide the output in the form of JSON like below, don't generate additional contents";
    prompt += 'Sample Response JSON: {"deployment": "cloud/edge", "networkSlice":"eMBB/mMTC/uRLLC"}';
    console.log(prompt);
    return prompt;
}

async function getHuggingFaceCategories() {
    try {
        const response = await axios.get(`${HUGGING_FACE_URL}/tasks`, {
            headers: {
                Authorization: `Bearer ${HUGGING_FACE_KEY}`,
            },
        });
  
        const categories = Object.keys(response.data);
        console.debug('Categories:', categories);
        return categories;
    } catch (error) {
        console.error('Error fetching categories:', error.response ? error.response.data : error.message);
    }
}

async function getHuggingFaceModels(category){
    try{

        const response = await axios.get(`${HUGGING_FACE_URL}/models`,{
            params: {
                filter: category,
                sort: "downloads",
                limit: 5,
            },
            headers: {
                Authorization: `Bearer ${HUGGING_FACE_KEY}`,
            },
        });
        const models = response.data;
        const modelsList = [];
        for(let model of models){
            console.log(model.downloads);
            modelsList.push(model.id);
        }
        return modelsList;

    }catch(error){
        console.error(error);
        throw new Error("An Error while getting the models from hugging face")
    }
}

function checkAndGetCategory(response, categories){
    response = response.toLowerCase().replaceAll(' ', '-').trim();
    for(let category of categories){
        if(response.includes(category))
            return category;
    }
    throw new Error("No matching category found");
}

function validateAndGetDeployment(response){
    const result = response.response.candidates[0].content.parts[0].text;
    if(!result.includes("{") && !result.includes("}")){
        throw new Error("Invalid Response from Gemini");
    }
    const cleanedData = result.replace(/```json|```/g, '').trim();
    const jsonObject = JSON.parse(cleanedData);
    if(!jsonObject["deployment"] || !jsonObject["networkSlice"]){
        throw new Error("Invalid Response from Gemini");
    }
    return jsonObject;
}


module.exports={chatWithGeminiAndGetAppropriateModel, chatWithGeminiAndGetAppropriateDeploymentType};
