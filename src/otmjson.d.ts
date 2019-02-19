interface OtmJson {
    words: OtmWord[];
    dictionaryName?: string;
}

interface OtmWord {
    entry: OtmEntry;
    translations: OtmTranslation[];
    tags: string[];
    contents: OtmContent[];
    variations: any[];
    relations: OtmRelation[];
}

interface OtmEntry {
    id: number;
    form: string;
}

interface OtmTranslation {
    title: string;
    forms: string[];
}

interface OtmContent {
    title: string;
    text: string;
}

interface OtmRelation {
    title: string;
    entry: OtmEntry;
}