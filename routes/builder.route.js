const express = require("express")
const bodyParser = require('body-parser');
const axios = require("axios");
const req = require("express/lib/request");
const PIPELINE_ENDPOINT = process.env.PIPELINE_ENDPOINT;
const builderRouter = express.Router();

builderRouter.use(bodyParser.json());


builderRouter.post('/', async (request, response) => {
    const reqBody = {model_name: request.body.model, task_name: request.body.category};
    const res = await axios.post(PIPELINE_ENDPOINT, reqBody);
    if(request.body?.deploymentType?.toLowercase() == "edge"){
        //TODO
        //provide edge access to ue
    }
    console.log(res);
    response.status(200);
    response.end();
});

module.exports = builderRouter;