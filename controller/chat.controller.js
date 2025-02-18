const {chatWithGeminiAndGetAppropriateModel, chatWithGeminiAndGetAppropriateDeploymentType} = require('../service/chat.service')

const recommendModelController = async (req, res)  => {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res.status(400).json({ error: 'Message is required' });
    }
    try{
        const result = await chatWithGeminiAndGetAppropriateModel(userMessage);
        res.status(200);
        res.json(typeof result === 'object' ? result : {message:result})
    } catch (error) {
      console.error('Error generating response:', error);
      res.status(400);
      res.json({message:error.message})
      res.end();
    }
} 

const recommendDeploymentController = async (req, res)  => {
  const latency = req.body.latency;
  const noOfDevices = req.body.numberOfDevices
  const dataBandWidth = req.body.inputBandWidth
  if (!latency || !noOfDevices || !dataBandWidth) {
    return res.status(400).json({ error: 'Latency, Number of devices and InputData Bandwidth are required' });
  }
  try{
      const result = await chatWithGeminiAndGetAppropriateDeploymentType(latency, noOfDevices, dataBandWidth);
      res.status(200);
      res.json(typeof result === 'object' ? result : {message:result})
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(400);
    res.json({message:error.message})
    res.end();
  }
} 

module.exports = {recommendModelController, recommendDeploymentController};