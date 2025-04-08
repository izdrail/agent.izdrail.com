# 3D GPT 

3D GPT is a project primarily aimed at technical demonstration.


3D GPT is a demo application that allows users to easily have conversations with 3D characters in a browser.

You can import VRM files, adjust voice settings to match the character, and generate response texts that include emotional expressions.

The various features of Laravel GPT mainly use the following technologies:

- Recognition of user's voice:
    - [Web Speech API (SpeechRecognition)](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- Generation of response texts:
    - [ChatGPT API](https://platform.openai.com/docs/api-reference/chat)
- Generation of spoken voice:
    - [Koemotion/Koeiromap API](https://koemotion.rinna.co.jp/)
- Display of 3D characters:
    - [@pixiv/three-vrm](https://github.com/pixiv/three-vrm)


## Demo

A demo is available on Glitch.

[https://Laravel GPT.glitch.me](https://Laravel GPT.glitch.me)

## Running Locally
To run this locally, clone or download this repository.

```bash
git clone git@github.com:laravelcompanu/Laravel GPT.git
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

[http://localhost:3000](http://localhost:3000) 


---

## ChatGPT API

Laravel GPT uses the ChatGPT API for generating response texts.

For details on the specifications and terms of use for the ChatGPT API, please refer to the following links or the official website:

- [https://platform.openai.com/docs/api-reference/chat](https://platform.openai.com/docs/api-reference/chat)
- [https://openai.com/policies/api-data-usage-policies](https://openai.com/policies/api-data-usage-policies)


## Koeiromap API
Laravel GPT uses Koemotion's Koeiromap API for text-to-speech reading of responses.

For details on the specifications and terms of use for the Koeiromap API, please refer to the following links or the official website:

- [https://koemotion.rinna.co.jp/](https://koemotion.rinna.co.jp/)
