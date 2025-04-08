# 3D GPT 
![3D Chat](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ah8r75v3edx8atxje7ir.png)
3D GPT is a project primarily aimed at technical demonstration.

3D GPT is a demo application that allows users to easily have conversations with 3D characters in a browser.

You can import VRM files, adjust voice settings to match the character, and generate response texts that include emotional expressions.

The various features of Ollama mainly use the following technologies:

- Recognition of user's voice:
    - [Web Speech API (SpeechRecognition)](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- Generation of response texts:
    - [ChatGPT API](https://platform.openai.com/docs/api-reference/chat)
- Generation of spoken voice:
    - [Audio API](https://audio.izdrail.com/docs)
- Display of 3D characters:
    - [@pixiv/three-vrm](https://github.com/pixiv/three-vrm)


## Demo

A demo is available on Agent.IZDRAIL.com

[https://agent.izdrail.com](https://agent.izdrail.com)

## Running Locally
To run this locally, clone or download this repository.

```bash
git clone git@github.com:izdrail/agent.izdrail.com
```

Install the required packages.
```bash
npm install
```

After installing the packages, start the development web server with the following command:
```bash
npm run dev
```

Once the server is running, access the following URL to verify its operation:

[http://localhost:1603](http://localhost:1603) 


---

## ChatGPT API

3D GPT uses the Ollam API for generating response texts, and it is running on CPU inferince.

For details on the specifications and terms of use for the Ollam API, please refer to the following links or the official website:

- [https://ollama.com/](https://ollama.com)


## Audio API
3d Agent uses Conqua TTS for text-to-speech reading of responses.

For details on the specifications and terms of use for the Audio API, please refer to the following links or the official website

[https://izdrail.com/](https://izdrail.com)