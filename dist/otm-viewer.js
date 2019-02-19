"use strict";
class OtmViewer {
    constructor() {
        this.search = () => {
            switch (this.searchType()) {
                case OtmViewer.SearchType.WORD:
                    this.results(this.searchWords());
                    break;
                case OtmViewer.SearchType.TRANSLATION:
                    this.results(this.searchTranslations());
                default:
                    break;
            }
        };
        this.otmlist = [];
        this.results = ko.observableArray([]);
        this.searchWord = ko.observable("");
        this.searchType = ko.observable(OtmViewer.SearchType.WORD);
        this.matchType = ko.observable(OtmViewer.MatchType.FORWARD);
        this.count = ko.pureComputed(() => this.results().length);
    }
    /**
     * readFiles
     */
    readFiles(files) {
        this.otmlist.length = 0;
        const array = Array.from(files);
        array.forEach((value) => {
            const reader = new FileReader();
            reader.addEventListener("load", (event) => {
                const otm = JSON.parse(event.target.result);
                otm.dictionaryName = value.name;
                this.otmlist.push(otm);
            });
            reader.readAsText(value);
        });
    }
    searchWords() {
        const searchWord = this.searchWord();
        let filterFunc = null;
        switch (this.matchType()) {
            case OtmViewer.MatchType.FORWARD:
                filterFunc = (y) => y.entry.form.startsWith(searchWord);
                break;
            case OtmViewer.MatchType.BACKWARD:
                filterFunc = (y) => y.entry.form.endsWith(searchWord);
                break;
            default:
                filterFunc = (y) => y.entry.form.match(".?" + searchWord + ".?") !== null;
                break;
        }
        if (filterFunc === null) {
            return [];
        }
        else {
            return this.otmlist.map((x) => x.words.filter(filterFunc).map((y) => {
                return {
                    name: x.dictionaryName,
                    word: y,
                };
            })).reduce((acc, x) => acc.concat(x)).sort((x, y) => {
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
    }
    searchTranslations() {
        const searchWord = this.searchWord();
        let filterFunc = null;
        switch (this.matchType()) {
            case OtmViewer.MatchType.FORWARD:
                filterFunc = (y) => y.translations.some(z => z.forms.findIndex(w => w.startsWith(searchWord)) !== -1);
                break;
            case OtmViewer.MatchType.BACKWARD:
                filterFunc = (y) => y.translations.some(z => z.forms.findIndex(w => w.endsWith(searchWord)) !== -1);
                break;
            default:
                filterFunc = (y) => y.translations.some(z => z.forms.findIndex(w => w.match(".?" + searchWord + ".?") !== null) !== -1);
                break;
        }
        if (filterFunc === null) {
            return [];
        }
        else {
            return this.otmlist.map((x) => x.words.filter(filterFunc).map((y) => {
                return {
                    name: x.dictionaryName,
                    word: y,
                };
            })).reduce((acc, x) => acc.concat(x)).sort((x, y) => {
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
    ALL: "all"
};
OtmViewer.MatchType = {
    FORWARD: "forward",
    BACKWARD: "backward",
    PARTIAL: "partial",
};
//# sourceMappingURL=otm-viewer.js.map