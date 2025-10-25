--keyterms workflow--
1 - check for existing csv / keyterms, and autopopulate them into the keyterms text box.
1a - if there are no keyterms and if user has pressed the LLM keyterms button, take the info from video files / meta data, use that to send an API request with the keyterms prompt to selected LLM, receive the response, write it to the csv and save the csv. then the terms populate into the text box for step 2.
2 - user can read / modify keyterms before transcription 
2a - existing keyterms can be added to through LLM search, and the user can either preserve the existing terms and submit with the request, or overwrite all existing terms.
***need to make a adjust / alternate prompt that combines existing keyterms from the csv to be added to the LLM request***
— technical notes—
there will be selectable LLM Model toggle, Anthropic / OpenAI, located in advanced options. API keys will be read from the env file.
prompt request is comprised of the info/meta data of the video files + any existing data in the keyterms file + the keyterms prompt. prompt outputs in the exact format to match the standard and is saved into the csv file which then refreshes the keyterms prompt text box.
—GUI Notes—LLM Keyterms Button and / or checkbox, should be located near the keyterms input box. minimal design that is compact and doesn’t disrupt the design.
There should be a button that sends the request to the LLM separate from the transcribe function, so it can populate the response into the keyterms csv
Model Select - Located in the advanced settings, selects between Anthropic (Claude Sonnet, Claude Haiku, GPT 5, GPT 5 Mini)
Need a minimal cost estimation for sending to the LLM, could be added in or similar to the transcription cost estimate.
Tyler B. Crawford