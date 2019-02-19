interface ViewResult {
    name: string;
    word: OtmWord;
}

class OtmViewer {
    private otmlist: OtmJson[];
    public results: KnockoutObservableArray<ViewResult>;
    public searchWord: KnockoutObservable<string>;
    public searchType: KnockoutObservable<string>;
    public matchType: KnockoutObservable<string>;
    public count: KnockoutComputed<number>;

    constructor() {
        this.otmlist = [];

        this.results = ko.observableArray([]);
        this.searchWord = ko.observable("");
        this.searchType = ko.observable(OtmViewer.SearchType.WORD);
        this.matchType = ko.observable(OtmViewer.MatchType.FORWARD);
        this.count = ko.pureComputed(() => this.results().length);
    }

    search = () => {
        switch (this.searchType()) {
            case OtmViewer.SearchType.WORD:
                this.results(this.searchWords());
                break;
            case OtmViewer.SearchType.TRANSLATION:
                this.results(this.searchTranslations());
            default:
                break;
        }
    }
    
    /**
     * readFiles
     */
    public readFiles(files: FileList) {
        this.otmlist.length = 0;
        const array = Array.from(files);

        array.forEach((value) => {
            const reader = new FileReader();
            
            reader.addEventListener("load", (event) => {
                const otm = JSON.parse((event.target as FileReader).result as string) as OtmJson;
                otm.dictionaryName = value.name;
                this.otmlist.push(otm);
            })

            reader.readAsText(value);
        });
    }

    private searchWords(): ViewResult[] {
        const searchWord = this.searchWord();
        let filterFunc: ((y: OtmWord) => boolean) | null = null;

        switch (this.matchType()) {
            case OtmViewer.MatchType.FORWARD:
                filterFunc = (y: OtmWord) => y.entry.form.startsWith(searchWord);
                break;
            case OtmViewer.MatchType.BACKWARD:
                filterFunc = (y: OtmWord) => y.entry.form.endsWith(searchWord);
                break;
            default:
                filterFunc = (y: OtmWord) => y.entry.form.match(".?" + searchWord + ".?") !== null;
                break;
        }

        if(filterFunc === null) {
            return [];
        }
        else {
            return this.otmlist.map((x) => x.words.filter(filterFunc as (y: OtmWord) => boolean).map((y) => {
                return {
                    name: x.dictionaryName,
                    word: y,
                } as ViewResult;
            })).reduce((acc, x) => acc.concat(x)).sort((x, y) => {
                if(x.word.entry.form < y.word.entry.form) { return -1; }
                else if(x.word.entry.form > y.word.entry.form) { return 1; }
                else { return 0; }
            });
        }
    }

    private searchTranslations() {
        const searchWord = this.searchWord();
        let filterFunc: ((y: OtmWord) => boolean) | null = null;

        switch (this.matchType()) {
            case OtmViewer.MatchType.FORWARD:
                filterFunc = (y: OtmWord) => y.translations.some(z => z.forms.findIndex(w => w.startsWith(searchWord)) !== -1);
                break;
            case OtmViewer.MatchType.BACKWARD:
                filterFunc = (y: OtmWord) => y.translations.some(z => z.forms.findIndex(w => w.endsWith(searchWord)) !== -1);
                break;
            default:
                filterFunc = (y: OtmWord) => y.translations.some(z => z.forms.findIndex(w => w.match(".?" + searchWord + ".?") !== null) !== -1);
                break;
        }

        if(filterFunc === null) {
            return [];
        }
        else {
            return this.otmlist.map((x) => x.words.filter(filterFunc as (y: OtmWord) => boolean).map((y) => {
                return {
                    name: x.dictionaryName,
                    word: y,
                } as ViewResult;
            })).reduce((acc, x) => acc.concat(x)).sort((x, y) => {
                if(x.word.entry.form < y.word.entry.form) { return -1; }
                else if(x.word.entry.form > y.word.entry.form) { return 1; }
                else { return 0; }
            });
        }
    }

    static join(array: string[] | KnockoutObservableArray<string>) {
        return ko.unwrap(array).join(", ");
    }

    static split(array: string | KnockoutObservable<string>) {
        return ko.unwrap(array).split("\n");
    }

    static SearchType = {
        WORD: "word",
        TRANSLATION: "translation",
        ALL: "all"
    };

    static MatchType = {
        FORWARD: "forward",
        BACKWARD: "backward",
        PARTIAL: "partial",
    };
}