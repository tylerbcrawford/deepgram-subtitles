---
title: Keyterm Prompting
subtitle: >-
  Keyterm Prompting allows you to improve Keyword Recall Rate (KRR) for
  important keyterms or phrases up to 90%.
slug: docs/keyterm
---


`keyterm` *string*

<div class="flex flex-row gap-2">
  <span class="dg-badge"><span><Icon icon="file" /> Pre-recorded</span></span>
   <span class="dg-badge"><span><Icon icon="waveform-lines" /> Streaming</span></span>     <span class="dg-badge"><span><Icon icon="stream" />Flux</span></span>
  <span class="dg-badge pink"><span><Icon icon="language" /> Monolingual Only</span></span>
 
</div>

Instantly increase accuracy and recognition of up to 100 important terminology, product and company names, industry jargon, phrases and more.

<Info>
  Keyterm Prompting is only available for monolingual transcription using the [Nova-3 Model](/docs/models-languages-overview#nova-3). To boost recognition of keywords using another Deepgram model, use the [Keywords](/docs/keywords) feature.
</Info>

## Enable Feature

To enable Keyterm Prompting, add a `keyterm` parameter in the query string and set it to your chosen key term:

`keyterm=KEYTERM`

To transcribe audio from a file on your computer, run the following cURL command in a terminal or your favorite API client.

<CodeGroup>
  ```bash cURL
  curl \
    --request POST \
    --header 'Authorization: Token YOUR_DEEPGRAM_API_KEY' \
    --header 'Content-Type: audio/wav' \
    --data-binary @youraudio.wav \
    --url 'https://api.deepgram.com/v1/listen?model=nova-3&keyterm=KEYTERM'
  ```
</CodeGroup>

<Warning>
  Replace `YOUR_DEEPGRAM_API_KEY` with your [Deepgram API Key](/docs/create-additional-api-keys).
</Warning>

## Keyterm Examples & Best Practices

The following examples demonstrate how keyterms can significantly improve recognition accuracy and confidence scores for industry-specific terminology. These examples show typical improvements you might see across Drive-Thru, IVR, call center, and medical transcription use cases.

<Note>
  The confidence scores below are illustrative examples showing typical improvement patterns. Actual results may vary based on audio quality, accent, and context.
</Note>

| Source | Confidence Score before | Confidence Score after |
| ------------------------------ | ------------------------------------------- | ------------------------------------------- |
| nacho stack double crunch taco | `"word": "macho", "confidence": 0.88728034` | `"word": "nacho", "confidence": 0.99029267` |
| bacon cheeseburger | `"word": "bake in", "confidence": 0.83456712` | `"word": "bacon", "confidence": 0.98234156` |
| crispy seasoned fries | `"word": "crisp he", "confidence": 0.79812345` | `"word": "crispy", "confidence": 0.97456789` |
| account number | `"word": "a count", "confidence": 0.82154321` | `"word": "account", "confidence": 0.97891234` |
| representative | `"word": "represent a tip", "confidence": 0.79043218` | `"word": "representative", "confidence": 0.98654321` |
| billing department | `"word": "building", "confidence": 0.81234567` | `"word": "billing", "confidence": 0.96789012` |
| escalation | `"word": "escalate shin", "confidence": 0.76543210` | `"word": "escalation", "confidence": 0.98123456` |
| customer service | `"word": "customer", "confidence": 0.84567890` | `"word": "customer", "confidence": 0.97234567` |
| technical support | `"word": "tech nil call", "confidence": 0.83456789` | `"word": "technical", "confidence": 0.98345678` |
| tretinoin | `"word": "try to win", "confidence": 0.71234567` | `"word": "tretinoin", "confidence": 0.96543210` |
| prescription refill | `"word": "per scription", "confidence": 0.78901234` | `"word": "prescription", "confidence": 0.97567890` |
| diagnosis | `"word": "diagnose us", "confidence": 0.80123456` | `"word": "diagnosis", "confidence": 0.98901234` |
| appointment scheduling | `"word": "a point men", "confidence": 0.85678901` | `"word": "appointment", "confidence": 0.98234567` |

### Best Practices for Keyterm Selection

When choosing keyterms, consider the following guidelines to maximize accuracy:

**Good Keyterm Examples:**
* **Industry-specific terminology**: Medical terms (`tretinoin`, `diagnosis`), technical jargon (`escalation`, `API`)
* **Product and company names**: Brand names, service names, competitor names
* **Multi-word phrases**: Common phrases in your domain (`account number`, `customer service`)
* **Proper nouns**: Names, brands, titles with appropriate capitalization (`Deepgram`, `iPhone`, `Dr. Smith`)
* **Common non-proper nouns**: Use lowercase (`algorithm`, `protocol`, `refill`)

**What to Avoid:**
* **Generic common words**: Very common words that are rarely misrecognized (`the`, `and`, `is`)
* **Overly broad terms**: Words that appear in many contexts without specific meaning
* **Excessive keyterms**: Stay well under the 500 token limit; focus on the most important 20-50 terms
* **Inconsistent formatting**: Ensure capitalization matches your desired output

## Case Sensitivity and Formatting
Keyterms preserve formatting (including case and punctuation) which can help control how proper nouns, product names, or company names are transcribed. The model will use both the keyterm formatting and the audio context to determine the final transcription format.

Best practices for keyterm formatting:

* For proper nouns (names, brands, titles): Use appropriate capitalization (`Deepgram`, `iPhone`, `Dr. Smith`)
* For non-proper nouns: Use lowercase (`tretinoin`, `algorithm`, `protocol`)

When smart formatting is applied to the transcript, words that start sentences may be automatically capitalized regardless of keyterm formatting.

Note that while the model was trained with formatted keyterms, the final transcription may not always exactly match the keyterm's formatting. The model balances the keyterm information with the audio context when determining capitalization and punctuation in the output.


## Using Multiple Keyterms

A space must be properly URL-encoded to ensure compatibility. Both `%20` and `+` are valid encodings, but their usage depends on context. In URL paths, spaces must be encoded as `%20`, while in query parameters, either `%20` or `+` can be used.

You can pass in multiple keywords in your query string in several ways:


Repeat the `keyterm` parameter for each keyterm to ensure each keyterm is processed individually.

<CodeGroup>
  ```bash cURL
  curl \
    --request POST \
    --header 'Authorization: Token YOUR_DEEPGRAM_API_KEY' \
    --header 'Content-Type: audio/wav' \
    --data-binary @youraudio.wav \
    --url "https://api.deepgram.com/v1/listen?model=nova-3&keyterm=KEYTERM1&keyterm=KEYTERM2"
  ```
</CodeGroup>

Use an encoded space `%20` to separate each keyterm and combine multiple keyterms into a single space-delimited value and boost an entire phrase as a cohesive unit.

<CodeGroup>
  ```bash cURL
  curl \
    --request POST \
    --header 'Authorization: Token YOUR_DEEPGRAM_API_KEY' \
    --header 'Content-Type: audio/wav' \
    --data-binary @youraudio.wav \
    --url "https://api.deepgram.com/v1/listen?model=nova-3&keyterm=term1%20term2"
  ```
</CodeGroup>

Use a plus `+` to separate each keyterm and combine multiple keyterms into a single space-delimited value and boost an entire phrase as a cohesive unit.
<CodeGroup>
  ```bash cURL
  curl \
    --request POST \
    --header 'Authorization: Token YOUR_DEEPGRAM_API_KEY' \
    --header 'Content-Type: audio/wav' \
    --data-binary @youraudio.wav \
    --url "https://api.deepgram.com/v1/listen?model=nova-3&keyterm=term1+term2"
  ```
</CodeGroup>

## Key Term Limits

Key Terms are limited to 500 tokens per request; anything beyond that will return an error like so:

<CodeGroup>
  ```text Error
  Keyterm limit exceeded. The maximum number of tokens across all keyterms is 500.
  ```
</CodeGroup>
