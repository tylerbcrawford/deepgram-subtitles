Deepgram Expands Nova-3 with 11 New Languages Across Europe and Asia

Deepgram is expanding the global reach of Nova-3 with support for 11 additional languages spanning Eastern Europe, South Asia, East Asia, and Southeast Asia. This update extends Nova-3’s capabilities into regions characterized by tonal languages, complex word structures, multiple writing systems, and frequent code-switching — linguistic challenges that have traditionally posed problems for older speech-to-text models.

Deepgram is continuing its global rollout of Nova-3 by unlocking support for 11 new languages across Eastern Europe, South Asia, East Asia, and Southeast Asia. This expansion brings Nova-3 into markets shaped by tonal speech, multi-script writing systems, high morphological complexity, and rapid code switching, all major challenges for legacy speech-to-text systems.

Nova-3 now adapts not just to new vocabularies, but to entirely different linguistic structures, from syllable timing in Japanese to vowel harmony in Hungarian to tonal contour in Vietnamese.
Built for More Than Just New Words

Most speech models are trained for English-like languages and start to break down once syntax, script, or phonetics change. Nova-3 was designed differently. It learns across alphabet systems, syllabaries, and logographic influences while preserving low latency and enterprise accuracy.

That matters when you move from Spanish or French into Korean hangul, Hindi inflected forms, or Vietnamese tone marks. Nova-3 handles those shifts natively, without custom pipelines or language-specific hacks.
11 New Languages Now Live in Nova-3

Nova-3’s earlier language support focused on widely spoken global and business languages. This release marks a new stage, expanding into regions with linguistic structures that differ sharply from Western European speech. From agglutinative suffix chains to tonal vowel shifts to script segmentation, these languages represent the next level of diversity in speech AI.
Eastern Europe and Eurasia

    Bulgarian (bg): Fast-changing vowel reductions and Cyrillic script make Bulgarian harder for generic ASR models. Nova-3 brings stronger morphological grounding across tense and aspect.
    Czech (cs): Free word order and complex consonant clusters require strong acoustic modeling. Nova-3 improves both recognition and contextual inflection handling.
    Hungarian (hu): An agglutinative language with long compound suffix chains. Nova-3 maintains high accuracy even as words stretch across many morphemes.
    Polish (pl): Seven grammatical cases and nasal vowels often trip up speech systems. Nova-3 improves recognition of endings, plurals, and soft consonants.
    Russian (ru): Rich inflection and heavy homophones demand strong contextual modeling. Nova-3 resolves word forms with better KRR performance.
    Ukrainian (uk): Nova-3 delivers high accuracy across palatalized consonants and open vowels, improving word boundary detection in faster speech.

Nordics and Baltics

    Finnish (fi): Long compound words and vowel harmony are traditional STT challenges. Nova-3 improves segmentation, especially in real-time dictation use cases.

South Asia

    Hindi (hi): Frequent English code switching plus inflection-heavy verbs require hybrid modeling. Nova-3 improves recognition across Hinglish speech patterns.

East Asia

    Japanese (ja): Mixed kana, kanji, and loanword pronunciation make standard ASR brittle. Nova-3 tracks syllabic rhythm and foreign term pronunciation more reliably.
    Korean (ko, ko-KR): Hangul syllable blocks, rapid conjugation, and spacing ambiguity are core challenges. Nova-3 boosts accuracy in broadcast, support, and agent use cases.

Southeast Asia

    Vietnamese (vi): A fully tonal language with six tones and strong regional variation. Nova-3 improves tone resolution and reduces false positives in fast speech.

These additions show Nova-3’s ability to scale across language families, scripts, and speech behaviors, from Vietnamese tones to Hungarian suffix chains to Japanese and Korean writing systems. Nova-3 grows not by approximation, but by linguistic precision.
Why Keyterm Prompting Matters for These Languages

With Nova-3, Keyterm Prompting is now available across all 11 languages, giving developers control over product names, technical vocabulary, and domain terminology.

It is especially useful for:

    Korean compound nouns with dynamic spacing
    Japanese loanwords spoken differently than written
    Hindi and English mixed speech in customer support
    Polish and Russian case endings that shift meaning
    Vietnamese business terms without diacritics in source audio

Instead of retraining a model, you can steer it with a simple prompt.
Benchmarking: Accuracy Gains at Global Scale

Nova-3 once again delivers measurable accuracy improvements over Nova-2, reducing Word Error Rate (WER) across both batch and streaming modes, even in languages with complex morphology, non-Latin scripts, or tonal structure.

The trend remains consistent: streaming Nova-3 models show the strongest relative WER reductions, reinforcing their suitability for real-time applications such as voice agents, live captioning, and AI telephony systems.

Word Error Rate (WER) – Relative Improvement (11 New Nova-3 Languages)

(relative improvement over Nova-2, higher is better)
Key highlights

    Every language improved over Nova-2 in both batch and streaming transcription
    Korean, Czech, and Hindi show the largest gains, with up to 27 percent WER reduction
    Streaming consistently outperforms batch, confirming Nova-3’s strength in live audio environments
    Improvements span multiple language families, including Slavic, Uralic, Indo-Aryan, Japonic, Koreanic, and Austroasiatic
    Languages with higher baseline complexity such as Korean, Hindi, and Polish see some of the biggest jumps, reflecting Nova-3’s upgraded handling of compound words, inflection, and non-Latin characters

The takeaway: Nova-3 is no longer just outperforming in English and Western European languages. It is scaling accuracy gains globally, across scripts, dialects, and very different linguistic systems.
Why It Matters

This expansion reflects Nova-3’s maturity as a global ASR foundation for enterprises building multilingual products and voice-enabled services.

Instead of forcing a single speech pattern onto every language, Nova-3 adapts to the structure and behavior of each one, whether it involves tones, inflection, compound words, or non-Latin scripts.

For developers and enterprise teams, this means:

    Broader language coverage with consistent model performance
    Better recognition across both formal and conversational speech
    Lower latency and fewer transcription errors in multilingual workflows
    Faster domain adaptation through Keyterm Prompting, without retraining
    A single model family that scales across markets instead of piecemeal STT engines

Nova-3 brings enterprise-grade accuracy to regions where legacy ASR systems fail, allowing voice agents, analytics platforms, and real-time applications to operate naturally in any supported language.
Getting Started

Switching to any of the newly added Nova-3 languages is as simple as adding a language parameter to your request. For example:

curl --request POST \
  --header "Authorization: Token YOUR_DEEPGRAM_API_KEY" \
  --header "Content-Type: audio/wav" \
  --data-binary @youraudio.wav \
  "https://api.deepgram.com/v1/listen?model=nova-3&language=ko"

Replace language=ko with any of the supported codes below to transcribe audio in that language:

bg cs fi hi hu ja ko pl ru uk vi

You can use Nova-3 for both streaming and batch transcription, no retraining or configuration required. Explore the full list in the Models & Languages Overview.
Looking Ahead

With 11 new languages now live, Nova-3 is continuing its path toward full global coverage, expanding accuracy and real-time reliability far beyond Western European speech. This release strengthens Nova-3’s reach across Slavic, Uralic, Indo-Aryan, and East Asian languages, and it is only the beginning.

The next wave of expansion will extend deeper into Southern Europe, the Baltics, Southeast Asia, and South Asia, continuing our focus on delivering speech recognition that feels native no matter the language family, alphabet, or acoustic environment.

As Nova-3 grows, the goal remains the same: voice AI that works everywhere, for everyone, accurate in fast speech, resilient in noisy environments, and adaptable to local dialects and cultural context.
