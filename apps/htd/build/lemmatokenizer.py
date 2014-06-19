import re

LEMMA_TOKENIZER = (re.compile(r"^([a-z-]+) (of| of the) ([a-z-]+)$", re.I),
                   re.compile(r"^([^' ]+)('s |'s-|' |-| )([a-z-]+)$", re.I),)


def tokenize_lemma(lemma, entry_lemma, subentry_type, etyma):
    match1 = LEMMA_TOKENIZER[0].search(lemma)
    match2 = LEMMA_TOKENIZER[1].search(lemma)
    word1, word2 = (None, None)
    if match1 is not None:
        # 'x of y'-type compounds: we reverse the order of the words,
        #  since 'admiral of the fleet' is like 'fleet admiral'
        word1 = match1.group(3)
        word2 = match1.group(1)
    elif match2 is not None:
        # ... whereas these are regular 'x-y'-type compounds, so we keep
        #  the words in their regular order
        word1 = match2.group(1)
        word2 = match2.group(3)
    elif (subentry_type == 'compound' and
            lemma.startswith(entry_lemma)):
        word1 = entry_lemma
        word2 = lemma.replace(entry_lemma, '').strip(' -')
        word2 = re.sub(r"^'s[ -]*", '', word2)
    elif (not subentry_type and
            len(etyma) == 2 and
            lemma.lower() == ''.join(etyma).lower()):
        word1 = etyma[0]
        word2 = etyma[1]

    # Affix entries
    if word1 is None and subentry_type == 'affix':
        prefix = entry_lemma.strip('-')
        if (lemma.startswith(prefix) and
                len(lemma) > len(prefix) + 3):
            word1 = prefix
            word2 = lemma[len(prefix):]

    # Try again with the etyma, allowing a bit more flexibility in
    #  how they're combined to produce the lemma
    if (word1 is None and
            not subentry_type and
            lemma.lower() == entry_lemma.lower() and
            len(etyma) == 2):
        et1 = etyma[0]
        et2 = etyma[1]
        if (et1.startswith('-') or
                et1.endswith('-') or
                et2.startswith('-') or
                et2.endswith('-')):
            # Skip if either is an affix
            pass
        elif et1.lower()[0:4] == et2.lower()[0:4]:
            # Skip if the two etyma are actually two versions
            #  of the same words
            pass
        else:
            et1_short = et1.lower()[0:4]
            et2_short = et2.lower()[-4:]
            if (lemma.lower().startswith(et1_short) and
                    lemma.lower().endswith(et2_short)):
                word1 = et1
                word2 = et2

    return word1, word2