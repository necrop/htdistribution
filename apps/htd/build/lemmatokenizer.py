import re

LEMMA_TOKENIZER = (re.compile(r"^([a-z-]+) (of| of the) ([a-z-]+)$", re.I),
                   re.compile(r"^([^' ]+)('s |'s-|' |-| )([a-z-]+)$", re.I),)


def tokenize_lemma(lemma, entry_lemma, subentry_type, etyma):
    m1 = LEMMA_TOKENIZER[0].search(lemma)
    m2 = LEMMA_TOKENIZER[1].search(lemma)
    w1, w2 = (None, None)
    if m1 is not None:
        # 'x of y'-type compounds: we reverse the order of the words,
        #  since 'admiral of the fleet' is like 'fleet admiral'
        w1 = m1.group(3)
        w2 = m1.group(1)
    elif m2 is not None:
        # ... whereas these are regular 'x-y'-type compounds, so we keep
        #  the words in their regular order
        w1 = m2.group(1)
        w2 = m2.group(3)
    elif (subentry_type == 'compound' and
            lemma.startswith(entry_lemma)):
        w1 = entry_lemma
        w2 = lemma.replace(entry_lemma, '').strip(' -')
        w2 = re.sub(r"^'s[ -]*", '', w2)
    elif (not subentry_type and
            len(etyma) == 2 and
            lemma.lower() == ''.join(etyma).lower()):
        w1 = etyma[0]
        w2 = etyma[1]

    # Affix entries
    if w1 is None and subentry_type == 'affix':
        prefix = entry_lemma.strip('-')
        if (lemma.startswith(prefix) and
                len(lemma) > len(prefix) + 3):
            w1 = prefix
            w2 = lemma[len(prefix):]

    # Try again with the etyma, allowing a bit more flexibility in
    #  how they're combined to produce the lemma
    if (w1 is None and
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
                w1 = et1
                w2 = et2

    return w1, w2