After reviewing the keyterm documentation, here's the updated prompt with specific requirements:

```
You are assisting with audio transcription accuracy by generating a keyterm list for Deepgram Nova-3 API's keyterm prompting feature.

TASK:
Research the following show/movie and create a focused list of keyterms that will improve transcription accuracy: "{SHOW_NAME}"

SEARCH REQUIREMENTS:
Search for information using reliable, authoritative sources such as:
- IMDb (Internet Movie Database)
- Wikipedia and Fandom wikis
- Official production websites and press materials
- Entertainment databases (TMDB, TV databases)
- Reviews from major publications (if they contain character/term lists)

KEYTERMS TO IDENTIFY (Priority Order):
1. Character names that sound like common words or might be misheard
   - Example: "Khaleesi" (might be heard as "Kelly see")
2. Fictional location names and place names
   - Example: "Westeros", "Tatooine"
3. Unique terminology, jargon, or invented words specific to the show
   - Example: "Valyrian", "lightsaber"
4. Multi-word phrases that are commonly used together
   - Example: "May the Force", "Winter is coming"
5. Organization, company, or group names
6. Important object or artifact names
7. Uncommon character names (especially alien, fantasy, or sci-fi names)

CRITICAL FORMATTING RULES:
- Proper nouns (names, places, titles): Use appropriate capitalization
  Examples: "Deepgram", "Dr. Smith", "iPhone", "Westeros"
- Common nouns and technical terms: Use lowercase
  Examples: "lightsaber", "algorithm", "protocol"
- Multi-word phrases: Maintain natural capitalization
  Examples: "account number", "customer service"

WHAT TO AVOID:
- Generic common words (the, and, is, said, etc.)
- Words that are rarely misrecognized
- Overly broad terms without specific meaning in context
- Excessive keyterms (stay focused on most important)

QUANTITY LIMIT:
Generate ONLY the 20-50 most critical terms that are:
- Most likely to be misheard or confused with other words
- Essential character/location names used frequently
- Unique to this show's universe

The 500 token limit means quality over quantity - prioritize terms with highest potential for transcription errors.

OUTPUT FORMAT:
Provide ONLY a simple comma-separated list of keyterms with proper capitalization. Do not include headers, context notes, or explanations.

Example format:
Khaleesi,Westeros,Valyrian,Dothraki,Jon Snow,Daenerys Targaryen,White Walkers,Kings Landing,Iron Throne,dragonglass

Begin your research and generate the keyterm list now.
```

**Key changes based on the documentation:**

1. **Reduced limit**: Changed from 50-100 to **20-50 terms** as the doc recommends
2. **Capitalization rules**: Added specific instructions for proper nouns (capitalized) vs. common nouns (lowercase)
3. **Focus on misheard words**: Emphasized terms likely to be confused or misrecognized
4. **Token limit warning**: Added mention of the 500 token limit
5. **Simpler CSV format**: Changed to just comma-separated keyterms without context column (cleaner for processing)
6. **Avoid list**: Added specific guidance on what NOT to include based on doc's best practices
7. **Multi-word phrases**: Explicitly mentioned these are valuable