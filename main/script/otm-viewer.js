"use strict";
class OtmViewer {
    constructor() {
        this.readFiles = (_, event) => {
            let files = null;
            if (!(event.target instanceof HTMLInputElement)) {
                throw new TypeError("invalid elements");
            }
            files = event.target.files;
            if (files === null) {
                throw new ReferenceError("files is null");
            }
            this.otmlist.length = 0;
            const array = Array.from(files);
            this.readFileNames(array.map(x => x.name));
            array.forEach((value) => {
                const reader = new FileReader();
                reader.addEventListener("load", (event) => {
                    const otm = JSON.parse(event.target.result);
                    otm.dictionaryName = value.name;
                    this.otmlist.push(otm);
                });
                reader.readAsText(value);
            });
        };
        this.otmlist = [];
        this.results = ko.observableArray([]);
        this.searchWord = ko.observable("");
        this.searchType = ko.observable(OtmViewer.SearchType.WORD);
        this.matchType = ko.observable(OtmViewer.MatchType.FORWARD);
        this.count = ko.pureComputed(() => this.results().length);
        this.readFileNames = ko.observableArray([]);
        this.selected = ko.observable("1");
        this.scriptFunc = ko.observable("");
    }
    tabClick(_data, event) {
        const target = event.target;
        if (target === null) {
            throw new TypeError("event target is nothing");
        }
        const valueAttr = target.attributes.getNamedItem("data-tab-value");
        if (valueAttr === null) {
            return;
        }
        this.selected(valueAttr.value);
    }
    search() {
        switch (this.searchType()) {
            case OtmViewer.SearchType.WORD:
                this.results(this.searchWords());
                break;
            case OtmViewer.SearchType.TRANSLATION:
                this.results(this.searchTranslations());
                break;
            case OtmViewer.SearchType.ALL:
                this.results(this.searchAll());
                break;
            case OtmViewer.SearchType.WORD_TAG:
                this.results(this.searchWordTags());
                break;
            case OtmViewer.SearchType.TRANSLATION_TAG:
                this.results(this.searchTranslationTags());
                break;
            case OtmViewer.SearchType.VARIATION_TAG:
                this.results(this.searchVariationTags());
                break;
            default:
                break;
        }
    }
    searchScript() {
        const data = this.scriptFunc();
        if (typeof (data) === "string" && data !== "") {
            const func = new Function("word", data);
            this.results(this.getResult(func));
        }
    }
    searchWords() {
        const searchWord = this.searchWord();
        let filterFunc = null;
        switch (this.matchType()) {
            case OtmViewer.MatchType.FORWARD:
                filterFunc = (word) => word.entry.form.startsWith(searchWord);
                break;
            case OtmViewer.MatchType.BACKWARD:
                filterFunc = (word) => word.entry.form.endsWith(searchWord);
                break;
            case OtmViewer.MatchType.REGEXP:
                filterFunc = (word) => word.entry.form.match(searchWord) !== null;
                break;
            default:
                filterFunc = (word) => word.entry.form.indexOf(searchWord) !== -1;
                break;
        }
        return this.getResult(filterFunc);
    }
    searchTranslations() {
        const searchWord = this.searchWord();
        let filterFunc = null;
        switch (this.matchType()) {
            case OtmViewer.MatchType.FORWARD:
                filterFunc = (word) => word.translations.some(z => z.forms.findIndex(w => w.startsWith(searchWord)) !== -1);
                break;
            case OtmViewer.MatchType.BACKWARD:
                filterFunc = (word) => word.translations.some(z => z.forms.findIndex(w => w.endsWith(searchWord)) !== -1);
                break;
            case OtmViewer.MatchType.REGEXP:
                filterFunc = (word) => word.translations.some(z => z.forms.findIndex(w => w.match(searchWord) !== null) !== -1);
                break;
            default:
                filterFunc = (word) => word.translations.some(z => z.forms.findIndex(w => w.indexOf(searchWord) !== -1) !== -1);
                break;
        }
        return this.getResult(filterFunc);
    }
    searchAll() {
        const searchWord = this.searchWord();
        let filterFunc = null;
        switch (this.matchType()) {
            case OtmViewer.MatchType.FORWARD:
                filterFunc = (word) => {
                    return word.entry.form.startsWith(searchWord) ||
                        word.translations.some(z => z.forms.findIndex(w => w.startsWith(searchWord)) !== -1) ||
                        word.contents.some(z => z.text.startsWith(searchWord)) ||
                        word.variations.some(z => z.form.startsWith(searchWord));
                };
                break;
            case OtmViewer.MatchType.BACKWARD:
                filterFunc = (word) => {
                    return word.entry.form.endsWith(searchWord) ||
                        word.translations.some(z => z.forms.findIndex(w => w.endsWith(searchWord)) !== -1) ||
                        word.contents.some(z => z.text.endsWith(searchWord)) ||
                        word.variations.some(z => z.form.endsWith(searchWord));
                };
                ;
                break;
            case OtmViewer.MatchType.REGEXP:
                filterFunc = (word) => {
                    return word.entry.form.match(searchWord) !== null ||
                        word.translations.some(z => z.forms.findIndex(w => w.match(searchWord) !== null) !== -1) ||
                        word.contents.some(z => z.text.match(searchWord) !== null) ||
                        word.variations.some(z => z.form.match(searchWord) !== null);
                };
                break;
            default:
                filterFunc = (word) => {
                    return word.entry.form.indexOf(searchWord) !== -1 ||
                        word.translations.some(z => z.forms.findIndex(w => w.indexOf(searchWord) !== -1) !== -1) ||
                        word.contents.some(z => z.text.indexOf(searchWord) !== -1) ||
                        word.variations.some(z => z.form.indexOf(searchWord) !== -1);
                };
                break;
        }
        return this.getResult(filterFunc);
    }
    searchWordTags() {
        const searchWord = this.searchWord();
        let filterFunc = null;
        switch (this.matchType()) {
            case OtmViewer.MatchType.FORWARD:
                filterFunc = (word) => word.tags.some(z => z.startsWith(searchWord));
                break;
            case OtmViewer.MatchType.BACKWARD:
                filterFunc = (word) => word.tags.some(z => z.endsWith(searchWord));
                break;
            case OtmViewer.MatchType.REGEXP:
                filterFunc = (word) => word.tags.some(z => z.match(searchWord) !== null);
                break;
            default:
                filterFunc = (word) => word.tags.some(z => z.indexOf(searchWord) !== -1);
                break;
        }
        return this.getResult(filterFunc);
    }
    searchTranslationTags() {
        const searchWord = this.searchWord();
        let filterFunc = null;
        switch (this.matchType()) {
            case OtmViewer.MatchType.FORWARD:
                filterFunc = (word) => word.translations.some(z => z.title.startsWith(searchWord));
                break;
            case OtmViewer.MatchType.BACKWARD:
                filterFunc = (word) => word.translations.some(z => z.title.endsWith(searchWord));
                break;
            case OtmViewer.MatchType.REGEXP:
                filterFunc = (word) => word.translations.some(z => z.title.match(searchWord) !== null);
                break;
            default:
                filterFunc = (word) => word.translations.some(z => z.title.indexOf(searchWord) !== -1);
                break;
        }
        return this.getResult(filterFunc);
    }
    searchVariationTags() {
        const searchWord = this.searchWord();
        let filterFunc = null;
        switch (this.matchType()) {
            case OtmViewer.MatchType.FORWARD:
                filterFunc = (word) => word.variations.some(z => z.title.startsWith(searchWord));
                break;
            case OtmViewer.MatchType.BACKWARD:
                filterFunc = (word) => word.variations.some(z => z.title.endsWith(searchWord));
                break;
            case OtmViewer.MatchType.REGEXP:
                filterFunc = (word) => word.variations.some(z => z.title.match(searchWord) !== null);
                break;
            default:
                filterFunc = (word) => word.variations.some(z => z.title.indexOf(searchWord) !== -1);
                break;
        }
        return this.getResult(filterFunc);
    }
    getResult(filterFunc) {
        if (filterFunc === null) {
            return [];
        }
        else {
            const result = this.otmlist.map((x) => x.words.filter(filterFunc).map((y) => {
                return {
                    name: x.dictionaryName,
                    word: y,
                };
            }));
            if (result.length !== 0) {
                return result.reduce((acc, x) => acc.concat(x)).sort((x, y) => {
                    if (x.word.entry.form < y.word.entry.form) {
                        return -1;
                    }
                    else if (x.word.entry.form > y.word.entry.form) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                });
            }
            else {
                return [];
            }
        }
    }
    static join(array) {
        return ko.unwrap(array).join(", ");
    }
    static split(array) {
        return ko.unwrap(array).split("\n");
    }
}
OtmViewer.SearchType = {
    WORD: "word",
    TRANSLATION: "translation",
    ALL: "all",
    WORD_TAG: "wordTag",
    TRANSLATION_TAG: "translationTag",
    VARIATION_TAG: "variationTag",
};
OtmViewer.MatchType = {
    FORWARD: "forward",
    BACKWARD: "backward",
    PARTIAL: "partial",
    REGEXP: "regexp"
};
OtmViewer.SearchTypeList = [
    { name: "単語検索", value: OtmViewer.SearchType.WORD },
    { name: "訳語検索", value: OtmViewer.SearchType.TRANSLATION },
    { name: "全文検索", value: OtmViewer.SearchType.ALL },
    { name: "単語タグ検索", value: OtmViewer.SearchType.WORD_TAG },
    { name: "訳語タグ検索", value: OtmViewer.SearchType.TRANSLATION_TAG },
    { name: "変化形タグ検索", value: OtmViewer.SearchType.VARIATION_TAG },
];
OtmViewer.MatchTypeList = [
    { name: "前方一致", value: OtmViewer.MatchType.FORWARD },
    { name: "後方一致", value: OtmViewer.MatchType.BACKWARD },
    { name: "部分一致", value: OtmViewer.MatchType.PARTIAL },
    { name: "正規表現", value: OtmViewer.MatchType.REGEXP },
];
//# sourceMappingURL=otm-viewer.js.map