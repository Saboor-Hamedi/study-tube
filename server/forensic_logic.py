import spacy
import re
import statistics
from typing import List, Dict

# INDUSTRIAL NLP CORE
# We use spaCy for deterministic linguistic parsing (POS tagging + dependency mapping)
try:
    # Try loading the small model (standard for local inference)
    nlp = spacy.load("en_core_web_sm")
except:
    # Fallback/Safety: If model is missing, we log it and nullify the nlp object
    # This prevents the server from crashing on boot.
    print("[FORENSIC ENGINE] Model 'en_core_web_sm' missing. Run: python -m spacy download en_core_web_sm")
    nlp = None

def analyze_linguistics(text: str) -> List[Dict]:
    """
    Performs a deep structural audit of the text using POS tagging and Dependency Parsing.
    """
    print(f"[FORENSIC] Received Audit Request ({len(text)} chars)")
    if not nlp:
        print("[FORENSIC] Skipping Audit: NLP Model not loaded.")
        return []

    doc = nlp(text)
    highlights = []
    
    # Track dominant tense for consistency checks
    tenses = [t.morph.get("Tense")[0] for t in doc if t.pos_ == "VERB" and t.morph.get("Tense")]
    dominant_tense = max(set(tenses), key=tenses.count) if tenses else None

# ========== DICTIONARIES & MAPS ==========

# 1. WEAK VERBS -> STRONG ACADEMIC VERBS
strength_map = {
    "get": "obtain", "got": "obtained", "getting": "acquiring",
    "do": "perform", "does": "performs", "doing": "conducting",
    "make": "create", "made": "generated", "making": "developing",
    "think": "contemplate", "thinks": "asserts", "thinking": "analyzing",
    "nice": "beneficial", "good": "effective", "bad": "detrimental",
    "stuff": "material", "thing": "element", "big": "substantial",
    "use": "utilize", "uses": "employs", "used": "leveraged", "using": "leveraging",
    "show": "demonstrate", "shows": "illustrates", "showed": "revealed", "showing": "indicating",
    "say": "assert", "says": "contends", "said": "stated", "saying": "arguing",
    "need": "require", "needs": "necessitates", "needed": "required",
    "help": "facilitate", "helps": "aids", "helped": "assisted", "helping": "enabling",
    "look": "examine", "looks": "analyzes", "looked": "investigated", "looking": "observing",
    "put": "position", "puts": "places", "putting": "placing",
    "try": "attempt", "tries": "endeavors", "tried": "sought", "trying": "pursuing"
}

# 2. SUBJECTIVE/EMOTIVE ADJECTIVES & AMPLIFIERS
subjective_words = [
    "amazing", "unbelievable", "horrible", "terrible", "wonderful", "very", "really", "extremely",
    "absolutely", "utterly", "completely", "totally", "entirely", "remarkable", "extraordinary",
    "incredible", "fantastic", "terrific", "immensely", "tremendously", "vastly", "great",
    "lovely", "fine", "superb", "excellent", "perfect", "awful", "lousy", "subpar",
    "clearly", "obviously", "undoubtedly", "definitely", "literally"
]

# 3. CLUTTER & REDUNDANCY PHRASES (Wordiness Audit)
combined_map = {
    "at this point in time": ("now", "Wordiness"),
    "due to the fact that": ("because", "Wordiness"),
    "in order to": ("to", "Wordiness"),
    "with the exception of": ("except", "Wordiness"),
    "in the near future": ("soon", "Wordiness"),
    "a large number of": ("many", "Wordiness"),
    "a small number of": ("few", "Wordiness"),
    "in the event that": ("if", "Wordiness"),
    "is able to": ("can", "Wordiness"),
    "until such time as": ("until", "Wordiness"),
    "it is important to note that": ("note that", "Wordiness"),
    "completely finished": ("finished", "Redundancy"),
    "close proximity": ("proximity", "Redundancy"),
    "basic fundamentals": ("fundamentals", "Redundancy"),
    "added bonus": ("bonus", "Redundancy"),
    "past history": ("history", "Redundancy"),
    "end result": ("result", "Redundancy"),
    "free gift": ("gift", "Redundancy"),
    "true facts": ("facts", "Redundancy"),
    "period of time": ("period", "Redundancy"),
    "absolutely essential": ("essential", "Redundancy"),
    "future plans": ("plans", "Redundancy"),
    "honest truth": ("truth", "Redundancy"),
    "prior to": ("before", "Wordiness"),
    "subsequent to": ("after", "Wordiness")
}

# 4. HEDGE PHRASES (Weak Claims)
hedge_map = {
    "it seems that": "Hedging",
    "it appears that": "Hedging",
    "it is possible that": "Hedging",
    "there is a chance that": "Hedging",
    "one might argue that": "Hedging",
    "it could be that": "Hedging",
    "this suggests that": "Hedging",
    "tends to": "Hedging",
    "to some extent": "Hedging",
    "perhaps": "Hedging",
    "maybe": "Hedging",
    "arguably": "Hedging",
    "presumably": "Hedging",
    "reportedly": "Hedging",
    "supposedly": "Hedging"
}

# 5. JARGON & BUZZWORDS
jargon_map = {
    "synergy": "cooperation",
    "disruptive": "innovative",
    "optimize": "improve",
    "bandwidth": "capacity",
    "deep dive": "thorough analysis",
    "holistic": "comprehensive"
}

# 6. NOMINALIZATION SUFFIXES
nominal_suffixes = ("tion", "ment", "ance", "ence", "ity", "ness", "ship")

def analyze_linguistics(text: str) -> List[Dict]:
    """
    Performs a deep structural audit of the text using POS tagging and Dependency Parsing.
    """
    print(f"[FORENSIC] Received Audit Request ({len(text)} chars)")
    if not nlp:
        print("[FORENSIC] Skipping Audit: NLP Model not loaded.")
        return []

    doc = nlp(text)
    highlights = []
    
    # Track dominant tense for consistency checks (Only consider finite verbs)
    tenses = [t.morph.get("Tense")[0] for t in doc if t.pos_ == "VERB" and t.tag_ in ["VBP", "VBZ", "VBD"] and t.morph.get("Tense")]
    dominant_tense = max(set(tenses), key=tenses.count) if tenses else None

    for token in doc:
        # 1. SUBJECT-VERB AGREEMENT (Expanded)
        if token.dep_ == "nsubj":
            verb = token.head
            if verb.pos_ == "VERB":
                # CASE: Relative Pronoun Agreement (that, which, who)
                # We need to find the antecedent to determine the correct number
                is_rel_pronoun = token.text.lower() in ["that", "which", "who"]
                
                is_plural_subj = False
                is_singular_subj = False
                
                if is_rel_pronoun:
                    # In a relative clause, the antecedent is usually the head of the verb
                    # e.g., "models (head) that (nsubj) assume (verb)"
                    antecedent = verb.head
                    if antecedent.tag_ in ["NNS", "NNPS"] or antecedent.text.lower() in ["people", "those", "these", "we", "they"]:
                        is_plural_subj = True
                    else:
                        is_singular_subj = True
                else:
                    is_plural_subj = token.tag_ in ["NNS", "NNPS"] or token.text.lower() in ["i", "you", "we", "they", "people", "these", "those"]
                    is_singular_subj = token.tag_ in ["NN", "NNP"] or token.text.lower() in ["he", "she", "it", "nobody", "everyone", "someone", "anybody", "this", "that"]

                # Check for "was" (VBD) with plural subject
                is_singular_past_be = verb.lemma_ == "be" and verb.text.lower() == "was"
                
                if is_plural_subj and (verb.tag_ == "VBZ" or is_singular_past_be):
                    # Helper function for verb conjugation
                    def get_correct_form(v, is_plural):
                        if v.lemma_ == "be":
                            if token.text.lower() == "i": return "am"
                            if token.text.lower() in ["you", "we", "they"] or is_plural: return "are"
                            return "is"
                        if v.lemma_ == "have":
                            return "have" if (is_plural or token.text.lower() in ["i", "you"]) else "has"
                        if is_plural or token.text.lower() in ["i", "you"]: return v.lemma_
                        b = v.lemma_
                        if b.endswith(("s", "sh", "ch", "x", "z", "o")): return b + "es"
                        if b.endswith("y") and len(b) > 1 and b[-2] not in "aeiou": return b[:-1] + "ies"
                        return b + "s"

                    correct = get_correct_form(verb, True)
                    highlights.append({
                        "start": verb.idx,
                        "end": verb.idx + len(verb.text),
                        "type": "grammar",
                        "reason": "Subject-Verb Agreement",
                        "suggestion": correct,
                        "explanation": f"The subject '{token.text}' requires the verb form '{correct}' (not '{verb.text}')."
                    })

                # CASE: 3rd Singular vs Base/Plural Verb
                is_singular_subj = token.tag_ in ["NN", "NNP"] or token.text.lower() in ["he", "she", "it", "nobody", "everyone", "someone", "anybody", "this", "that"]
                
                # SAFETY: Skip if verb has an auxiliary (e.g., "didn't work", "will go")
                has_aux = any(t.dep_ == "aux" for t in verb.children)
                
                if is_singular_subj and verb.tag_ in ["VBP", "VB"] and token.text.lower() not in ["i", "you", "we", "that", "which", "who"] and not has_aux:
                    def get_correct_form_sing(v):
                        if v.lemma_ == "be": return "is"
                        if v.lemma_ == "have": return "has"
                        b = v.lemma_
                        if b.endswith(("s", "sh", "ch", "x", "z", "o")): return b + "es"
                        if b.endswith("y") and len(b) > 1 and b[-2] not in "aeiou": return b[:-1] + "ies"
                        return b + "s"
                    correct = get_correct_form_sing(verb)
                    highlights.append({
                        "start": verb.idx,
                        "end": verb.idx + len(verb.text),
                        "type": "grammar",
                        "reason": "Subject-Verb Agreement",
                        "suggestion": correct,
                        "explanation": f"The singular subject '{token.text}' requires the verb form '{correct}' (not '{verb.text}')."
                    })

        # 2. SYNTACTIC FLOW & WORD ORDER (Misplaced Modifiers)
        # CASE: Adjective after Noun (Syntactic Inversion) - e.g., "The house blue"
        # We skip reduced relative clauses where the adjective has children (e.g., "grids capable of managing")
        if token.pos_ == "ADJ" and token.dep_ == "amod":
            noun = token.head
            has_children = any(t.dep_ != "punct" for t in token.children)
            if noun.pos_ == "NOUN" and token.i > noun.i and not has_children:
                highlights.append({
                    "start": noun.idx,
                    "end": token.idx + len(token.text),
                    "type": "syntax",
                    "reason": "Syntactic Inversion",
                    "suggestion": f"{token.text} {noun.text}",
                    "explanation": f"Adjective '{token.text}' is misplaced after the noun '{noun.text}'. Adjectives usually precede nouns in English."
                })

        # CASE: Determiner-Noun Number Agreement - e.g., "Those car", "This books"
        if token.pos_ == "DET" and token.dep_ == "det":
            noun = token.head
            if noun.pos_ == "NOUN":
                det_plural = token.text.lower() in ["those", "these", "many", "several", "few"]
                noun_plural = noun.tag_ in ["NNS", "NNPS"]
                if det_plural != noun_plural and token.text.lower() not in ["the", "a", "an", "some", "any", "no", "all"]:
                    highlights.append({
                        "start": token.idx,
                        "end": token.idx + len(token.text),
                        "type": "grammar",
                        "reason": "Determiner Agreement",
                        "suggestion": "that/this" if noun_plural else "those/these",
                        "explanation": f"The determiner '{token.text}' does not match the number of the noun '{noun.text}'."
                    })

        # 3. PRONOUN CASE AUDIT (Hardened)
        # CASE A: Objective pronouns as subjects (Him was sitting)
        if token.text.lower() in ["him", "her", "us", "them"] and token.dep_ == "nsubj":
            # SAFETY: Ensure the head is a finite verb (not an infinitive or part of a complex object)
            if token.head.tag_ in ["VBP", "VBZ", "VBD", "MD"]:
                mapping = {"him": "He", "her": "She", "us": "We", "them": "They"}
                highlights.append({
                    "start": token.idx,
                    "end": token.idx + len(token.text),
                    "type": "grammar",
                    "reason": "Pronoun Case Error",
                    "suggestion": mapping.get(token.text.lower(), "Subject pronoun"),
                    "explanation": f"The objective pronoun '{token.text}' is used as a subject. Use '{mapping.get(token.text.lower())}'."
                })
            
        # CASE B: Objective pronouns used as possessives (Him head)
        if token.text.lower() in ["him", "them", "us"] and token.dep_ == "poss":
            mapping = {"him": "his", "them": "their", "us": "our"}
            highlights.append({
                "start": token.idx,
                "end": token.idx + len(token.text),
                "type": "grammar",
                "reason": "Possessive Case Error",
                "suggestion": mapping.get(token.text.lower(), "Possessive"),
                "explanation": f"Objective pronoun '{token.text}' used incorrectly as a possessive. Use '{mapping.get(token.text.lower())}'."
            })

        # 3. PASSIVE VOICE DETECTOR (Tone & Sophistication)
        # We look for AUX (be) + VERB (past participle)
        if token.pos_ == "VERB" and token.tag_ == "VBN":
            aux_pass = [t for t in token.children if t.dep_ == "auxpass"]
            if aux_pass:
                # DYNAMIC REWRITE: Try to find the agent (the 'by' phrase)
                agent = [t for t in token.children if t.dep_ == "agent"]
                nsubj_pass = [t for t in token.children if t.dep_ == "nsubjpass"]
                
                suggestion = None
                if agent and nsubj_pass:
                    # Get the 'pobj' of the agent (e.g., 'me' in 'by me')
                    pobj = [t for t in agent[0].children if t.dep_ == "pobj"]
                    if pobj:
                        # Get full subtree for the object and agent (preserving 'the', 'his', etc.)
                        # We lowercase the first word of the object if it's being moved to the middle
                        obj_tokens = [t.text for t in nsubj_pass[0].subtree]
                        if obj_tokens and obj_tokens[0].lower() in ["the", "a", "an", "this", "that", "these", "those"]:
                            obj_tokens[0] = obj_tokens[0].lower()
                        obj_text = " ".join(obj_tokens)
                        
                        agent_text = pobj[0].text.lower()
                        agent_map = {"me": "I", "him": "he", "her": "she", "us": "we", "them": "they"}
                        
                        if agent_text in agent_map:
                            agent_subject = agent_map[agent_text]
                        else:
                            agent_tokens = [t.text for t in pobj[0].subtree]
                            agent_subject = " ".join(agent_tokens)
                        
                        # Get verb tense to preserve it
                        tense = token.morph.get("Tense")
                        verb_active = token.lemma_ + ("ed" if not token.lemma_.endswith("e") else "d")
                        if tense and "Past" in tense:
                             suggestion = f"{agent_subject} {verb_active} {obj_text}"
                
                highlights.append({
                    "start": aux_pass[0].idx,
                    "end": token.idx + len(token.text),
                    "type": "tone",
                    "reason": "Passive Voice",
                    "suggestion": suggestion,
                    "explanation": "Passive voice detected. In academic writing, active voice is often preferred for clarity and directness."
                })

        # 4. TENSE CONSISTENCY CHECK
        # If a finite verb deviates from the dominant tense without a conjunction or shift-marker
        if dominant_tense and token.pos_ == "VERB" and token.tag_ in ["VBP", "VBZ", "VBD"]:
            token_tense = token.morph.get("Tense")
            
            # SAFETY: Skip check for modal-influenced verbs (e.g. "could diminish", "will act")
            has_modal = any(t.pos_ == "MD" for t in token.children) or (token.head and any(t.pos_ == "MD" for t in token.head.children))
            
            if token_tense and token_tense[0] != dominant_tense and not has_modal:
                # Basic heuristic: Check if it's a jarred shift in the same sentence
                if not any(t.text.lower() in ["but", "while", "although", "when", "if"] for t in token.sent):
                    highlights.append({
                        "start": token.idx,
                        "end": token.idx + len(token.text),
                        "type": "syntax",
                        "reason": "Tense Inconsistency",
                        "suggestion": None,
                        "explanation": f"Possible tense shift detected ('{token_tense[0]}' vs dominant '{dominant_tense}'). Ensure consistency."
                    })

        # 5. ARTICLE-PHONETIC AGREEMENT (Deep Logic)
        if token.text.lower() in ["a", "an"]:
            next_token = token.nbor(1) if token.i + 1 < len(doc) else None
            if next_token and next_token.pos_ not in ["PUNCT", "SPACE"]:
                first_letter = next_token.text[0].lower()
                is_vowel_sound = first_letter in "aeiou"
                
                # Handle 'u' exceptions (University vs Umbrella)
                if first_letter == 'u':
                    is_vowel_sound = next_token.text.lower().startswith(("un", "um", "up")) and not next_token.text.lower().startswith("uni")
                
                # Handle 'h' exceptions (Hour vs House)
                if first_letter == 'h':
                    is_vowel_sound = next_token.text.lower().startswith(("hour", "hon"))

                if token.text.lower() == "a" and is_vowel_sound:
                    highlights.append({
                        "start": token.idx,
                        "end": token.idx + len(token.text),
                        "type": "diction",
                        "reason": "Article Error",
                        "suggestion": "an",
                        "explanation": f"Use 'an' before vowel sounds (e.g., '{next_token.text}')."
                    })
                elif token.text.lower() == "an" and not is_vowel_sound:
                    highlights.append({
                        "start": token.idx,
                        "end": token.idx + len(token.text),
                        "type": "diction",
                        "reason": "Article Error",
                        "suggestion": "a",
                        "explanation": f"Use 'a' before consonant sounds (e.g., '{next_token.text}')."
                    })

        # 6. DOUBLE NEGATIVE AUDIT (Clause-Aware)
        if token.text.lower() in ["not", "n't", "never", "no", "hardly", "scarcely"]:
            # Check if this negative is attached to a verb that already has another negation
            verb = token.head
            if verb.pos_ == "VERB":
                other_negs = [t for t in verb.children if t.dep_ == "neg" and t.i != token.i]
                if other_negs:
                    sec = other_negs[0]
                    highlights.append({
                        "start": sec.idx,
                        "end": sec.idx + len(sec.text),
                        "type": "syntax",
                        "reason": "Double Negative",
                        "suggestion": "any" if sec.text.lower() == "no" else "ever",
                        "explanation": f"Double negative detected ('{token.text}' + '{sec.text}'). In academic writing, avoid using multiple negatives to express a single negation."
                    })

        # 7. CLUTTER & REDUNDANCY (Robust Matching)
        # We use the global combined_map now
        
        for phrase, (suggestion, reason) in combined_map.items():
            phrase_tokens = phrase.split()
            phrase_len = len(phrase_tokens)
            if token.i + phrase_len <= len(doc):
                doc_tokens = [t.text.lower() for t in doc[token.i : token.i + phrase_len]]
                if doc_tokens == phrase_tokens:
                    last_token = doc[token.i + phrase_len - 1]
                    highlights.append({
                        "start": token.idx,
                        "end": last_token.idx + len(last_token.text),
                        "type": "tone",
                        "reason": reason,
                        "suggestion": suggestion,
                        "explanation": f"The phrase '{phrase}' is {'wordy' if reason == 'Wordiness' else 'redundant'}. Use '{suggestion}' for better clarity."
                    })
        
        # 8. ACADEMIC TONE & JARGON (Neural Layer)
        word_lower = token.text.lower()
        lemma = token.lemma_.lower()
        
        # SAFETY: Skip words that are part of a hyphenated compound (e.g. "decision-making")
        is_compound = (token.i > 0 and doc[token.i-1].text == "-") or (token.i < len(doc)-1 and doc[token.i+1].text == "-")
        
        if not is_compound:
            # Jargon Check
            if lemma in jargon_map:
                highlights.append({
                    "start": token.idx,
                    "end": token.idx + len(token.text),
                    "type": "diction",
                    "reason": "Vague Jargon",
                    "suggestion": jargon_map[lemma],
                    "explanation": f"The word '{token.text}' is considered vague corporate jargon. Use '{jargon_map[lemma]}' for academic clarity."
                })
                
            # Weak Verbs Check
            elif word_lower in strength_map:
                is_aux = token.dep_ in ["aux", "auxpass"]
                is_negated = any(c.dep_ == "neg" for c in token.children) or any(c.text == "n't" for c in token.children)
                if not is_aux and not is_negated:
                    highlights.append({
                        "start": token.idx,
                        "end": token.idx + len(token.text),
                        "type": "diction",
                        "reason": "Weak Academic Verb",
                        "suggestion": strength_map[word_lower],
                        "explanation": f"The word '{token.text}' is vague. Consider a more precise academic alternative like '{strength_map[word_lower]}'."
                    })
                
        # Subjective Words Check
        elif word_lower in subjective_words:
            highlights.append({
                "start": token.idx,
                "end": token.idx + len(token.text),
                "type": "tone",
                "reason": "Subjective Language",
                "suggestion": None,
                "explanation": "Academic writing should remain objective. Avoid emotive or intensifying words."
            })

        # 9. PRONOUN AUDIT (First/Second Person)
        if word_lower in ["i", "me", "my", "mine", "we", "us", "our", "ours"]:
            # If it's "i", suggest "I" (Grammar fix)
            # Otherwise, suggest None to avoid replacing text with instructions
            suggestion = "I" if word_lower == "i" else None
            
            highlights.append({
                "start": token.idx,
                "end": token.idx + len(token.text),
                "type": "tone",
                "reason": "First Person Pronoun",
                "suggestion": suggestion,
                "explanation": "Academic writing often avoids first-person pronouns to maintain objectivity. Consider using impersonal constructions."
            })
        elif word_lower in ["you", "your", "yours"]:
            highlights.append({
                "start": token.idx,
                "end": token.idx + len(token.text),
                "type": "tone",
                "reason": "Second Person Pronoun",
                "suggestion": None,
                "explanation": "Avoid addressing the reader directly in formal academic writing."
            })

    # SECOND PASS: Phrase & Sentence-Level Audits
    full_text_lower = text.lower()
    
    # A. HEDGE PHRASE AUDIT
    for phrase, reason in hedge_map.items():
        # We use regex word boundaries to avoid catching phrases inside words
        pattern = rf"\b{re.escape(phrase)}\b"
        for match in re.finditer(pattern, full_text_lower):
            highlights.append({
                "start": match.start(),
                "end": match.end(),
                "type": "tone",
                "reason": reason,
                "suggestion": None,
                "explanation": f"The phrase '{phrase}' is a hedging expression. Academic writing should be assertive."
            })

    # B. FRAGMENT & READABILITY AUDIT
    for sent in doc.sents:
        # 1. FRAGMENT AUDIT
        root = sent.root
        has_subject = any(t.dep_ in ["nsubj", "nsubjpass"] for t in sent)
        has_finite_verb = any(t.tag_ in ["VBP", "VBZ", "VBD", "MD"] for t in sent)
        is_non_finite_root = root.tag_ in ["VBG", "VBN"] and not any(t.dep_ in ["aux", "auxpass"] for t in root.children)
        
        if (not has_subject or not has_finite_verb or is_non_finite_root) and len(sent) > 2:
            if sent[-1].text in [".", "!", "?"]:
                highlights.append({
                    "start": sent.start_char,
                    "end": sent.end_char,
                    "type": "syntax",
                    "reason": "Sentence Fragment",
                    "suggestion": None,
                    "explanation": "This sentence appears to be a fragment. Ensure it has both a subject and a finite verb."
                })

        # 2. PREPOSITIONAL PILE-UP (Reduced sensitivity for academic complex sentences)
        preps = [t for t in sent if t.pos_ == "ADP"]
        if len(preps) > 6:
            highlights.append({
                "start": sent.start_char,
                "end": sent.end_char,
                "type": "tone",
                "reason": "Prepositional Pile-up",
                "suggestion": None,
                "explanation": "High density of prepositional phrases (in, of, at) detected. Consider simplifying for better academic clarity."
            })

    # THIRD PASS: Paragraph-Level Flow Diagnostics
    # We audit cohesion and rhythmic variance across the entire manuscript
    paragraphs = [p for p in text.split("\n") if p.strip()]
    search_pos = 0
    for para in paragraphs:
        # Find exact position in the original text to maintain highlight accuracy
        start_idx = text.find(para, search_pos)
        if start_idx == -1: continue
        end_idx = start_idx + len(para)
        search_pos = end_idx
        
        para_doc = nlp(para)
        sentences = list(para_doc.sents)
        if not sentences: continue
        
        # A. TRANSITION DENSITY (Cohesion Audit)
        # Academic flow requires bridge words to link complex ideas
        transitions = ["however", "furthermore", "moreover", "consequently", "therefore", "nevertheless", "additionally", "similarly", "consequently"]
        found_transitions = [t for t in transitions if t in para.lower()]
        
        if len(para_doc) > 60 and len(found_transitions) < 1:
            highlights.append({
                "start": start_idx,
                "end": start_idx + min(len(para), 40), # Highlight the "Topic Sentence"
                "type": "tone",
                "reason": "Low Transition Density",
                "suggestion": None,
                "explanation": "This paragraph is dense but lacks transition words. Use bridge words (e.g., 'Furthermore', 'In contrast') to guide the reader through your logic."
            })

        # B. RHYTHMIC MONOTONY (Sentence Length Variance)
        # We calculate the standard deviation of sentence lengths using the statistics module
        if len(sentences) >= 4:
            lengths = [len(s.text.split()) for s in sentences]
            std_dev = statistics.stdev(lengths)
            
            if std_dev < 3.5: # Sentences are too similar in length
                highlights.append({
                    "start": start_idx,
                    "end": end_idx,
                    "type": "syntax",
                    "reason": "Rhythmic Monotony",
                    "suggestion": None,
                    "explanation": "Sentences in this paragraph have very similar lengths. Vary your sentence structure (combine or split) to create a more professional academic rhythm."
                })

    # FINAL PASS: Whitelist for false positives
    # Industrial safety layer: removes valid constructions often misidentified by NLP
    legitimate_patterns = [
        (r'\bhad\s+had\b', "Past perfect of 'have'"),
        (r'\bthat\s+that\b', "Nominal clause + demonstrative"),
        (r'\ba\s+unique\b', "'Unique' begins with consonant sound /juː/"),
        (r'\ba\s+university\b', "'University' begins with consonant sound /juː/"),
        (r'\ban\s+hour\b', "'Hour' has silent 'h', vowel sound"),
        (r'\b(?:saw|met|helped|told|asked)\s+them\b', "Valid object pronoun"),
        (r'\bparadigm\s+shift\b', "Fixed academic collocation"),
        (r'\brobust\s+(?:framework|methodology|approach|system)\b', "Standard academic phrasing"),
    ]

    def is_whitelisted(txt, start, end):
        substring = txt[start:end]
        for pattern, reason in legitimate_patterns:
            if re.search(pattern, substring, re.IGNORECASE):
                return True
        return False

    # Filter out whitelisted items
    highlights = [h for h in highlights if not is_whitelisted(text, h["start"], h["end"])]

    return highlights
