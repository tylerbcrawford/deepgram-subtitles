#!/usr/bin/env python3
"""
LLM-powered keyterm generation for Deepgram transcription accuracy.

This module provides intelligent keyterm generation using Large Language Models
(Anthropic Claude or OpenAI GPT) to analyze show/movie metadata and generate
contextually relevant keyterms that improve transcription accuracy up to 90%.
"""

from typing import List, Optional, Dict, Any
from pathlib import Path
from enum import Enum
import os


class LLMProvider(Enum):
    """Supported LLM providers."""
    ANTHROPIC = "anthropic"
    OPENAI = "openai"


class LLMModel(Enum):
    """Supported LLM models with their API identifiers."""
    # Anthropic models
    CLAUDE_SONNET_4 = "claude-sonnet-4-20250514"
    CLAUDE_HAIKU_4 = "claude-haiku-4-20250514"
    
    # OpenAI models
    GPT_4 = "gpt-4-turbo"
    GPT_4_MINI = "gpt-4o-mini"


# Model pricing (per 1M tokens) - as of 2025-10
MODEL_PRICING = {
    LLMModel.CLAUDE_SONNET_4: {"input": 3.00, "output": 15.00},
    LLMModel.CLAUDE_HAIKU_4: {"input": 0.25, "output": 1.25},
    LLMModel.GPT_4: {"input": 10.00, "output": 30.00},
    LLMModel.GPT_4_MINI: {"input": 0.15, "output": 0.60},
}


# Keyterm generation prompt template
KEYTERM_PROMPT_TEMPLATE = """You are assisting with audio transcription accuracy by generating a keyterm list for Deepgram Nova-3 API's keyterm prompting feature.

TASK:
Research the following show/movie and create a focused list of keyterms that will improve transcription accuracy: "{show_name}"

{existing_keyterms_section}

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

Begin your research and generate the keyterm list now."""


class KeytermSearcher:
    """Generate contextually relevant keyterms using LLM analysis."""
    
    def __init__(self, provider: LLMProvider, model: LLMModel, api_key: str):
        """
        Initialize KeytermSearcher with LLM configuration.
        
        Args:
            provider: LLM provider (Anthropic or OpenAI)
            model: Specific model to use
            api_key: API key for the provider
        
        Raises:
            ValueError: If provider/model combination is invalid
        """
        self.provider = provider
        self.model = model
        self.api_key = api_key
        self._client = None
        
        # Validate provider/model combination
        if provider == LLMProvider.ANTHROPIC:
            if model not in [LLMModel.CLAUDE_SONNET_4, LLMModel.CLAUDE_HAIKU_4]:
                raise ValueError(f"Model {model} not valid for provider {provider}")
        elif provider == LLMProvider.OPENAI:
            if model not in [LLMModel.GPT_4, LLMModel.GPT_4_MINI]:
                raise ValueError(f"Model {model} not valid for provider {provider}")
    
    def generate_from_metadata(
        self, 
        show_name: str, 
        existing_keyterms: Optional[List[str]] = None,
        preserve_existing: bool = False
    ) -> Dict[str, Any]:
        """
        Generate keyterms from show/movie metadata using LLM.
        
        Args:
            show_name: Name of show/movie (e.g., "Breaking Bad")
            existing_keyterms: Optional list of existing keyterms
            preserve_existing: If True, merge with existing; if False, overwrite
        
        Returns:
            Dict containing:
                - keyterms: List[str] - Generated keyterms
                - token_count: int - Total tokens used
                - estimated_cost: float - Cost in USD
                - provider: str - LLM provider used
                - model: str - Model used
        
        Raises:
            Exception: If LLM API call fails
        """
        # Build prompt
        prompt = self._build_prompt(show_name, existing_keyterms, preserve_existing)
        
        # Call appropriate LLM provider
        if self.provider == LLMProvider.ANTHROPIC:
            response_text, token_count = self._call_anthropic(prompt)
        elif self.provider == LLMProvider.OPENAI:
            response_text, token_count = self._call_openai(prompt)
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")
        
        # Parse response into keyterms
        keyterms = self._parse_response(response_text)
        
        # If preserving existing, merge them
        if preserve_existing and existing_keyterms:
            # Add existing keyterms that aren't already in the new list
            existing_lower = {k.lower() for k in existing_keyterms}
            new_lower = {k.lower() for k in keyterms}
            
            for existing in existing_keyterms:
                if existing.lower() not in new_lower:
                    keyterms.append(existing)
        
        # Calculate cost
        cost = self._calculate_cost(token_count)
        
        return {
            'keyterms': keyterms,
            'token_count': token_count,
            'estimated_cost': cost,
            'provider': self.provider.value,
            'model': self.model.value
        }
    
    def estimate_cost(self, show_name: str) -> Dict[str, Any]:
        """
        Estimate cost before making LLM request.
        
        Args:
            show_name: Name of show/movie
        
        Returns:
            Dict containing:
                - estimated_tokens: int - Estimated tokens
                - estimated_cost: float - Estimated cost in USD
                - model: str - Model that will be used
        """
        # Build prompt to estimate token count
        prompt = self._build_prompt(show_name)
        
        # Rough token estimation: ~1 token per 4 characters
        prompt_tokens = len(prompt) // 4
        
        # Estimated response tokens (20-50 keyterms, ~200 tokens)
        response_tokens = 200
        
        total_tokens = prompt_tokens + response_tokens
        cost = self._calculate_cost(total_tokens)
        
        return {
            'estimated_tokens': total_tokens,
            'estimated_cost': cost,
            'model': self.model.value
        }
    
    def _build_prompt(
        self, 
        show_name: str, 
        existing_keyterms: Optional[List[str]] = None,
        preserve_existing: bool = False
    ) -> str:
        """
        Build the LLM prompt from template and context.
        
        Args:
            show_name: Name of show/movie
            existing_keyterms: Optional list of existing keyterms
            preserve_existing: If True, instruct to preserve; if False, use as reference
        
        Returns:
            Complete prompt string
        """
        # Build existing keyterms section
        existing_section = self._build_existing_keyterms_section(
            existing_keyterms, 
            preserve_existing
        )
        
        # Format the template
        prompt = KEYTERM_PROMPT_TEMPLATE.format(
            show_name=show_name,
            existing_keyterms_section=existing_section
        )
        
        return prompt
    
    def _build_existing_keyterms_section(
        self, 
        existing: Optional[List[str]] = None, 
        preserve: bool = False
    ) -> str:
        """
        Build section for existing keyterms in prompt.
        
        Args:
            existing: Optional list of existing keyterms
            preserve: If True, instruct to preserve; if False, use as reference
        
        Returns:
            Formatted section string or empty string
        """
        if not existing:
            return ""
        
        keyterms_list = ', '.join(existing)
        
        if preserve:
            return f"""EXISTING KEYTERMS TO PRESERVE:
The following keyterms are already defined and should be included in your response:
{keyterms_list}

Your task is to ADD NEW keyterms that complement these existing ones. Include all existing keyterms in your output."""
        else:
            return f"""REFERENCE KEYTERMS:
The following keyterms were previously used (for reference only):
{keyterms_list}

Feel free to use these as inspiration but generate a fresh, optimized list."""
    
    def _parse_response(self, response: str) -> List[str]:
        """
        Parse LLM response into list of keyterms.
        
        Args:
            response: Raw LLM response text
        
        Returns:
            List of parsed keyterms
        """
        # Clean up response - remove extra whitespace and newlines
        response = response.strip()
        
        # Split by comma
        keyterms = [term.strip() for term in response.split(',')]
        
        # Filter out empty terms and duplicates (case-insensitive)
        seen = set()
        unique_keyterms = []
        
        for term in keyterms:
            if term and term.lower() not in seen:
                seen.add(term.lower())
                unique_keyterms.append(term)
        
        return unique_keyterms
    
    def _call_anthropic(self, prompt: str) -> tuple[str, int]:
        """
        Make API call to Anthropic Claude.
        
        Args:
            prompt: Formatted prompt string
        
        Returns:
            Tuple of (response_text, token_count)
        
        Raises:
            Exception: If API call fails
        """
        try:
            import anthropic
        except ImportError:
            raise ImportError(
                "anthropic package not installed. Install with: pip install anthropic>=0.30.0"
            )
        
        # Initialize client if needed
        if not self._client:
            self._client = anthropic.Anthropic(api_key=self.api_key)
        
        try:
            # Make API call
            message = self._client.messages.create(
                model=self.model.value,
                max_tokens=500,  # Limited for keyterm lists
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Extract response text
            response_text = message.content[0].text
            
            # Calculate total tokens
            token_count = message.usage.input_tokens + message.usage.output_tokens
            
            return response_text, token_count
            
        except Exception as e:
            raise Exception(f"Anthropic API call failed: {str(e)}")
    
    def _call_openai(self, prompt: str) -> tuple[str, int]:
        """
        Make API call to OpenAI GPT.
        
        Args:
            prompt: Formatted prompt string
        
        Returns:
            Tuple of (response_text, token_count)
        
        Raises:
            Exception: If API call fails
        """
        try:
            import openai
        except ImportError:
            raise ImportError(
                "openai package not installed. Install with: pip install openai>=1.35.0"
            )
        
        # Initialize client if needed
        if not self._client:
            self._client = openai.OpenAI(api_key=self.api_key)
        
        try:
            # Make API call
            response = self._client.chat.completions.create(
                model=self.model.value,
                max_tokens=500,  # Limited for keyterm lists
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that generates keyterm lists for transcription accuracy."},
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Extract response text
            response_text = response.choices[0].message.content
            
            # Calculate total tokens
            token_count = response.usage.prompt_tokens + response.usage.completion_tokens
            
            return response_text, token_count
            
        except Exception as e:
            raise Exception(f"OpenAI API call failed: {str(e)}")
    
    def _calculate_cost(self, token_count: int) -> float:
        """
        Calculate cost based on token count and model pricing.
        
        Args:
            token_count: Total tokens used (input + output)
        
        Returns:
            Cost in USD
        """
        pricing = MODEL_PRICING.get(self.model)
        if not pricing:
            return 0.0
        
        # Rough split: 85% input, 15% output (typical for this use case)
        input_tokens = int(token_count * 0.85)
        output_tokens = token_count - input_tokens
        
        # Calculate cost per million tokens
        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]
        
        return input_cost + output_cost