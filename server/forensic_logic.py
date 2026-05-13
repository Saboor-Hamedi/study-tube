import spacy
import re
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

    for token in doc:
        # 1. SUBJECT-VERB AGREEMENT (Expanded)
        if token.dep_ == "nsubj":
            verb = token.head
            if verb.pos_ == "VERB":
                # CASE: 1st/2nd/Plural vs 3rd Singular Verb
                # e.g., "I turns", "They goes", "People is", "We learns"
                is_plural_subj = token.tag_ in ["NNS", "NNPS"] or token.text.lower() in ["i", "you", "we", "they", "people", "these", "those"]
                
                # Dynamic Correction Helper
                def get_correct_form(v, is_plural):
                    if v.lemma_ == "be":
                        if token.text.lower() == "i": return "am"
                        if token.text.lower() in ["you", "we", "they"] or is_plural: return "are"
                        return "is"
                    if v.lemma_ == "have":
                        return "have" if (is_plural or token.text.lower() in ["i", "you"]) else "has"
                    
                    if is_plural or token.text.lower() in ["i", "you"]:
                        return v.lemma_
                    else:
                        # 3rd Person Singular logic
                        b = v.lemma_
                        if b.endswith(("s", "sh", "ch", "x", "z", "o")): return b + "es"
                        if b.endswith("y") and len(b) > 1 and b[-2] not in "aeiou": return b[:-1] + "ies"
                        return b + "s"

                if is_plural_subj and verb.tag_ == "VBZ":
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
                # e.g., "He go", "She want", "The man eat", "He cry", "Nobody talk"
                is_singular_subj = token.tag_ in ["NN", "NNP"] or token.text.lower() in ["he", "she", "it", "nobody", "everyone", "someone", "anybody", "this", "that"]
                if is_singular_subj and verb.tag_ in ["VBP", "VB"] and token.text.lower() not in ["i", "you"]:
                    correct = get_correct_form(verb, False)
                    highlights.append({
                        "start": verb.idx,
                        "end": verb.idx + len(verb.text),
                        "type": "grammar",
                        "reason": "Subject-Verb Agreement",
                        "suggestion": correct,
                        "explanation": f"The singular subject '{token.text}' requires the verb form '{correct}' (not '{verb.text}')."
                    })

        # 2. PRONOUN CASE AUDIT (Hardened)
        # CASE A: Objective pronouns as subjects (Him was sitting)
        if token.text.lower() in ["him", "her", "us", "them"] and token.dep_ == "nsubj":
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
                
                suggestion = "Active Voice"
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
        # If a verb deviates from the dominant tense without a conjunction or shift-marker
        if dominant_tense and token.pos_ == "VERB":
            token_tense = token.morph.get("Tense")
            if token_tense and token_tense[0] != dominant_tense:
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

        # 6. DOUBLE NEGATIVE AUDIT (Sentence-Aware)
        if token.text.lower() in ["not", "n't", "never", "no", "hardly", "scarcely"]:
            # Check the rest of the sentence for another negative
            sent_negatives = [t for t in token.sent if t.text.lower() in ["not", "n't", "never", "no", "hardly", "scarcely"] and t.i > token.i]
            if sent_negatives:
                sec = sent_negatives[0]
                highlights.append({
                    "start": sec.idx,
                    "end": sec.idx + len(sec.text),
                    "type": "syntax",
                    "reason": "Double Negative",
                    "suggestion": "any" if sec.text.lower() == "no" else "ever",
                    "explanation": f"Double negative detected ('{token.text}' + '{sec.text}'). In academic writing, avoid using multiple negatives to express a single negation."
                })

        # 7. CLUTTER & REDUNDANCY (Robust Matching)
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
            "period of time": ("period", "Redundancy")
        }
        
        for phrase, (suggestion, reason) in combined_map.items():
            phrase_tokens = phrase.split()
            phrase_len = len(phrase_tokens)
            if token.i + phrase_len <= len(doc):
                # We compare normalized token lists to avoid punctuation/space issues
                doc_tokens = [t.text.lower() for t in doc[token.i : token.i + phrase_len]]
                if doc_tokens == phrase_tokens:
                    # Get the correct end index from the last token in the match
                    last_token = doc[token.i + phrase_len - 1]
                    highlights.append({
                        "start": token.idx,
                        "end": last_token.idx + len(last_token.text),
                        "type": "tone",
                        "reason": reason,
                        "suggestion": suggestion,
                        "explanation": f"The phrase '{phrase}' is {'wordy' if reason == 'Wordiness' else 'redundant'}. Use '{suggestion}' for better clarity."
                    })
        
        # 7. WEAK VERBS & SUBJECTIVE TONE
        strength_map = {
            "get": "obtain", "got": "obtained", "getting": "acquiring",
            "do": "perform", "does": "performs", "doing": "conducting",
            "make": "create", "made": "generated", "making": "developing",
            "think": "contemplate", "thinks": "asserts", "thinking": "analyzing",
            "nice": "beneficial", "good": "effective", "bad": "detrimental",
            "stuff": "material", "thing": "element", "big": "substantial"
        }
        subjective_words = ["amazing", "unbelievable", "horrible", "terrible", "wonderful", "very", "really", "extremely"]

        word_lower = token.text.lower()
        if word_lower in strength_map:
            # SAFETY: Skip if it's an auxiliary (like 'do' in 'do not') or part of a contraction
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
        elif word_lower in subjective_words:
             highlights.append({
                "start": token.idx,
                "end": token.idx + len(token.text),
                "type": "tone",
                "reason": "Subjective Language",
                "suggestion": "Be more neutral",
                "explanation": "Academic writing should remain objective. Avoid emotive or intensifying words."
            })

        # 8. SENTENCE FRAGMENT DETECTOR (Finite Verb Check)
        # (This is handled in the sent loop below for efficiency)

    # SECOND PASS: Sentence-Level Audits
    for sent in doc.sents:
        # A. FRAGMENT AUDIT (Finite Root Check)
        # A valid sentence usually needs a finite ROOT verb or a subject+verb pair
        root = sent.root
        has_subject = any(t.dep_ in ["nsubj", "nsubjpass"] for t in sent)
        has_finite_verb = any(t.tag_ in ["VBP", "VBZ", "VBD", "MD"] for t in sent)
        
        # If the root is a non-finite verb (VBG, VBN) and there's no auxiliary (be/have/will)
        is_non_finite_root = root.tag_ in ["VBG", "VBN"] and not any(t.dep_ in ["aux", "auxpass"] for t in root.children)
        
        if (not has_subject or not has_finite_verb or is_non_finite_root) and len(sent) > 2:
            # Avoid flagging titles (often short, no punctuation)
            if sent[-1].text in [".", "!", "?"]:
                highlights.append({
                    "start": sent.start_char,
                    "end": sent.end_char,
                    "type": "syntax",
                    "reason": "Sentence Fragment",
                    "suggestion": None,
                    "explanation": "This sentence appears to be a fragment. Ensure it has both a subject and a finite verb."
                })

        # B. PREPOSITIONAL PILE-UP (Readability)
        preps = [t for t in sent if t.pos_ == "ADP"]
        if len(preps) > 3:
            # Check for consecutive chains
            chain_count = 0
            for i in range(len(sent)-1):
                if sent[i].pos_ == "ADP" and sent[i+1].pos_ == "DET": # common chain start
                    chain_count += 1
            if chain_count >= 3:
                highlights.append({
                    "start": sent.start_char,
                    "end": sent.end_char,
                    "type": "tone",
                    "reason": "Prepositional Pile-up",
                    "suggestion": "Simplify structure",
                    "explanation": "Too many prepositional phrases (in, of, at) in a row make sentences hard to follow."
                })

        # C. NOMINALIZATION (Action Audit)
        nominal_suffixes = ("tion", "ment", "ance", "ence", "ity")
        nominalizations = [t for t in sent if t.pos_ == "NOUN" and t.text.lower().endswith(nominal_suffixes)]
        if len(nominalizations) > 2:
            for n in nominalizations:
                highlights.append({
                    "start": n.idx,
                    "end": n.idx + len(n.text),
                    "type": "tone",
                    "reason": "Nominalization",
                    "suggestion": "Use a verb instead",
                    "explanation": f"The noun '{n.text}' makes the sentence abstract. Try using a stronger verb form."
                })

    return highlights

    return highlights
