import spacy
import re
from typing import List, Dict

# INDUSTRIAL NLP CORE

# We use spaCy for deterministic linguistic parsing (POS tagging + dependency mapping)

try: # Try loading the small model (standard for local inference)
nlp = spacy.load("en_core_web_sm")
except: # Fallback/Safety: If model is missing, we log it and nullify the nlp object # This prevents the server from crashing on boot.
print("[FORENSIC ENGINE] Model 'en_core_web_sm' missing. Run: python -m spacy download en_core_web_sm")
nlp = None

# ========== DICTIONARIES & MAPS ==========

# 1. WEAK VERBS → STRONG ACADEMIC VERBS

strength_map = { # Original entries
"get": "obtain", "got": "obtained", "getting": "acquiring",
"do": "perform", "does": "performs", "doing": "conducting",
"make": "create", "made": "generated", "making": "developing",
"think": "contemplate", "thinks": "asserts", "thinking": "analyzing",
"nice": "beneficial", "good": "effective", "bad": "detrimental",
"stuff": "material", "thing": "element", "big": "substantial",

    # New entries
    "use": "utilize", "uses": "employs", "used": "leveraged", "using": "leveraging",
    "show": "demonstrate", "shows": "illustrates", "showed": "revealed", "showing": "indicating",
    "say": "assert", "says": "contends", "said": "stated", "saying": "arguing",
    "need": "require", "needs": "necessitates", "needed": "required",
    "help": "facilitate", "helps": "aids", "helped": "assisted", "helping": "enabling",
    "look": "examine", "looks": "analyzes", "looked": "investigated", "looking": "observing",
    "put": "position", "puts": "places", "putting": "placing",
    "try": "attempt", "tries": "endeavors", "tried": "sought", "trying": "pursuing",
    "keep": "maintain", "keeps": "preserves", "kept": "sustained",
    "let": "permit", "lets": "allows", "letting": "authorizing",
    "start": "initiate", "starts": "commences", "started": "commenced", "starting": "launching",
    "end": "terminate", "ends": "concludes", "ended": "ceased",
    "fix": "remedy", "fixes": "rectifies", "fixed": "resolved",
    "give": "provide", "gives": "furnishes", "gave": "supplied", "giving": "conferring",
    "take": "acquire", "takes": "obtains", "took": "captured", "taking": "extracting"

}

# 2. SUBJECTIVE/EMOTIVE ADJECTIVES & AMPLIFIERS

subjective_words = [
# Original
"amazing", "unbelievable", "horrible", "terrible", "wonderful", "very", "really", "extremely",
# New
"absolutely", "utterly", "completely", "totally", "entirely",
"astonishing", "astounding", "remarkable", "extraordinary", "incredible", "fantastic", "terrific",
"excessively", "immensely", "tremendously", "vastly",
"great", "lovely", "fine", "superb", "excellent", "perfect",
"poor", "weak", "awful", "lousy", "mediocre", "subpar",
"clearly", "obviously", "undoubtedly", "certainly", "surely", "definitely", "literally"
]

# 3. CLUTTER & REDUNDANCY PHRASES

combined_map = { # Original
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

    # New - Wordiness Academic
    "in light of the fact that": ("because", "Wordiness"),
    "on the grounds that": ("because", "Wordiness"),
    "for the purpose of": ("to", "Wordiness"),
    "with reference to": ("about", "Wordiness"),
    "in relation to": ("about", "Wordiness"),
    "in the process of": ("during", "Wordiness"),
    "on the basis of": ("by", "Wordiness"),
    "by means of": ("via", "Wordiness"),
    "in accordance with": ("per", "Wordiness"),
    "with respect to": ("regarding", "Wordiness"),
    "in the case of": ("for", "Wordiness"),
    "on behalf of": ("for", "Wordiness"),
    "in spite of the fact that": ("although", "Wordiness"),
    "regardless of the fact that": ("although", "Wordiness"),
    "as a result of the fact that": ("because", "Wordiness"),
    "in the form of": ("as", "Wordiness"),
    "in a position to": ("able to", "Wordiness"),

    # New - Wordiness Temporal
    "at the present time": ("currently", "Wordiness"),
    "at this moment in time": ("now", "Wordiness"),
    "in the not too distant future": ("soon", "Wordiness"),
    "during the course of": ("during", "Wordiness"),
    "prior to": ("before", "Wordiness"),
    "subsequent to": ("after", "Wordiness"),

    # New - Redundancy
    "absolutely essential": ("essential", "Redundancy"),
    "basic necessity": ("necessity", "Redundancy"),
    "completely unanimous": ("unanimous", "Redundancy"),
    "cooperate together": ("cooperate", "Redundancy"),
    "each and every": ("each", "Redundancy"),
    "few in number": ("few", "Redundancy"),
    "first and foremost": ("first", "Redundancy"),
    "foreign imports": ("imports", "Redundancy"),
    "future plans": ("plans", "Redundancy"),
    "general public": ("public", "Redundancy"),
    "honest truth": ("truth", "Redundancy"),
    "if and when": ("if", "Redundancy"),
    "joint collaboration": ("collaboration", "Redundancy"),
    "mutual agreement": ("agreement", "Redundancy"),
    "new innovation": ("innovation", "Redundancy"),
    "null and void": ("void", "Redundancy"),
    "one and only": ("only", "Redundancy"),
    "over exaggerate": ("exaggerate", "Redundancy"),
    "personal opinion": ("opinion", "Redundancy"),
    "possible alternative": ("alternative", "Redundancy"),
    "protest against": ("protest", "Redundancy"),
    "reason why": ("reason", "Redundancy"),
    "revert back": ("revert", "Redundancy"),
    "still remains": ("remains", "Redundancy"),
    "sudden impulse": ("impulse", "Redundancy"),
    "summarize briefly": ("summarize", "Redundancy"),
    "unexpected surprise": ("surprise", "Redundancy"),
    "unintended mistake": ("mistake", "Redundancy"),
    "usual custom": ("custom", "Redundancy")

}

# 4. NOMINALIZATION SUFFIXES

nominal_suffixes = ( # Original
"tion", "ment", "ance", "ence", "ity", # New
"ness", "ship", "hood", "dom", "ism", "ology", "sion", "ure", "age", "al", "ery", "cy"
)

# 5. HEDGE PHRASES

hedge_map = {
"it seems that": ("", "Hedging"),
"it appears that": ("", "Hedging"),
"it is possible that": ("", "Hedging"),
"there is a chance that": ("", "Hedging"),
"one might argue that": ("", "Hedging"),
"it could be that": ("", "Hedging"),
"this suggests that": ("", "Hedging"),
"tends to": ("", "Hedging"),
"sort of": ("", "Hedging"),
"kind of": ("", "Hedging"),
"more or less": ("", "Hedging"),
"to some extent": ("", "Hedging"),
"in a sense": ("", "Hedging"),
"for the most part": ("", "Hedging")
}

# 6. PRONOUNS TO FLAG IN ACADEMIC WRITING

first_person_pronouns = ["i", "me", "my", "mine", "we", "us", "our", "ours"]
second_person_pronouns = ["you", "your", "yours"]

# 7. JARGON & BUZZWORDS

jargon_map = {
"synergy": "cooperation or combined effect",
"leverage": "use or utilize",
"paradigm": "model or framework",
"disruptive": "innovative or transformative",
"optimize": "improve or maximize efficiency",
"streamline": "simplify or make more efficient",
"circle back": "return to",
"touch base": "contact or discuss with",
"bandwidth": "capacity or resources",
"deep dive": "thorough analysis",
"low hanging fruit": "easy task",
"win-win": "mutually beneficial",
"think outside the box": "be creative or innovative",
"game changer": "significant innovation",
"best practice": "effective method",
"core competency": "primary strength",
"value add": "benefit or improvement",
"move the needle": "make a measurable difference",
"drill down": "examine in detail",
"holistic": "comprehensive",
"robust": "strong or reliable"
}

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

    # Helper function for verb conjugation
    def get_correct_form(v, is_plural, subject_text=""):
        if v.lemma_ == "be":
            if subject_text.lower() == "i":
                return "am"
            if subject_text.lower() in ["you", "we", "they"] or is_plural:
                return "are"
            return "is"
        if v.lemma_ == "have":
            return "have" if (is_plural or subject_text.lower() in ["i", "you"]) else "has"

        if is_plural or subject_text.lower() in ["i", "you"]:
            return v.lemma_
        else:
            # 3rd Person Singular logic
            b = v.lemma_
            if b.endswith(("s", "sh", "ch", "x", "z", "o")):
                return b + "es"
            if b.endswith("y") and len(b) > 1 and b[-2] not in "aeiou":
                return b[:-1] + "ies"
            return b + "s"

    # ========== MAIN TOKEN LOOP ==========
    for token in doc:
        # 1. SUBJECT-VERB AGREEMENT (Expanded)
        if token.dep_ == "nsubj":
            verb = token.head
            if verb.pos_ == "VERB":
                # CASE: Plural subject vs Singular Verb
                is_plural_subj = token.tag_ in ["NNS", "NNPS"] or token.text.lower() in ["i", "you", "we", "they", "people", "these", "those"]

                # Check for "was" (VBD) with plural subject
                is_singular_past_be = verb.lemma_ == "be" and verb.text.lower() == "was"

                if is_plural_subj and (verb.tag_ == "VBZ" or is_singular_past_be):
                    correct = get_correct_form(verb, True, token.text)
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

                if is_singular_subj and verb.tag_ in ["VBP", "VB"] and token.text.lower() not in ["i", "you"] and not has_aux:
                    correct = get_correct_form(verb, False, token.text)
                    highlights.append({
                        "start": verb.idx,
                        "end": verb.idx + len(verb.text),
                        "type": "grammar",
                        "reason": "Subject-Verb Agreement",
                        "suggestion": correct,
                        "explanation": f"The singular subject '{token.text}' requires the verb form '{correct}' (not '{verb.text}')."
                    })

        # 2. PRONOUN CASE AUDIT
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

        # 3. PASSIVE VOICE DETECTOR
        if token.pos_ == "VERB" and token.tag_ == "VBN":
            aux_pass = [t for t in token.children if t.dep_ == "auxpass"]
            if aux_pass:
                # DYNAMIC REWRITE: Try to find the agent (the 'by' phrase)
                agent = [t for t in token.children if t.dep_ == "agent"]
                nsubj_pass = [t for t in token.children if t.dep_ == "nsubjpass"]

                suggestion = "Active Voice"
                if agent and nsubj_pass:
                    pobj = [t for t in agent[0].children if t.dep_ == "pobj"]
                    if pobj:
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
        if dominant_tense and token.pos_ == "VERB":
            token_tense = token.morph.get("Tense")
            if token_tense and token_tense[0] != dominant_tense:
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

        # 6. DOUBLE NEGATIVE AUDIT
        if token.text.lower() in ["not", "n't", "never", "no", "hardly", "scarcely"]:
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

        # 8. WEAK VERBS & SUBJECTIVE TONE
        word_lower = token.text.lower()
        if word_lower in strength_map:
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

        # 9. FIRST PERSON PRONOUNS
        if word_lower in first_person_pronouns:
            highlights.append({
                "start": token.idx,
                "end": token.idx + len(token.text),
                "type": "tone",
                "reason": "First Person Pronoun",
                "suggestion": "Impersonal construction",
                "explanation": "Academic writing often avoids first-person pronouns. Consider using passive voice or impersonal expressions."
            })

        # 10. SECOND PERSON PRONOUNS
        elif word_lower in second_person_pronouns:
            highlights.append({
                "start": token.idx,
                "end": token.idx + len(token.text),
                "type": "tone",
                "reason": "Second Person Pronoun",
                "suggestion": "Third person or impersonal",
                "explanation": "Avoid addressing the reader directly ('you') in formal academic writing."
            })

        # 11. JARGON & BUZZWORDS
        lemma = token.lemma_.lower()
        if lemma in jargon_map:
            highlights.append({
                "start": token.idx,
                "end": token.idx + len(token.text),
                "type": "diction",
                "reason": "Jargon/Buzzword",
                "suggestion": jargon_map[lemma],
                "explanation": f"'{token.text}' is vague jargon. Consider: '{jargon_map[lemma]}'"
            })

    # ========== SECOND PASS: SENTENCE-LEVEL AUDITS ==========
    for sent in doc.sents:
        # A. FRAGMENT AUDIT (Finite Root Check)
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

        # B. PREPOSITIONAL PILE-UP (Readability)
        preps = [t for t in sent if t.pos_ == "ADP"]
        if len(preps) > 3:
            chain_count = 0
            for i in range(len(sent)-1):
                if sent[i].pos_ == "ADP" and sent[i+1].pos_ == "DET":
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

        # D. HEDGE PHRASES DETECTION
        sent_lower = sent.text.lower()
        for phrase, (suggestion, reason) in hedge_map.items():
            if phrase in sent_lower:
                start_idx = sent.start_char + sent_lower.find(phrase)
                end_idx = start_idx + len(phrase)
                highlights.append({
                    "start": start_idx,
                    "end": end_idx,
                    "type": "tone",
                    "reason": reason,
                    "suggestion": "Use direct, assertive language",
                    "explanation": f"Hedging phrase '{phrase}' weakens your claim. Be more direct."
                })

    return highlights
