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
    public readFileNames: KnockoutObservableArray<string>;

    constructor() {
        this.otmlist = [];

        this.results = ko.observableArray([]);
        this.searchWord = ko.observable("");
        this.searchType = ko.observable(OtmViewer.SearchType.WORD);
        this.matchType = ko.observable(OtmViewer.MatchType.FORWARD);
        this.count = ko.pureComputed(() => this.results().length);
        this.readFileNames = ko.observableArray([]);
    }

    public search() {
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
            default:
                break;
        }
    }

    public readFiles = (_: any, event: Event) => {
        let files: FileList | null = null;
        if(!(event.target instanceof HTMLInputElement)) {
            throw new TypeError("invalid elements");
        }

        files = event.target.files;

        if(files === null) {
            throw new ReferenceError("files is null");
        }

        this.otmlist.length = 0;
        const array = Array.from(files);
        this.readFileNames(array.map(x => x.name));

        array.forEach((value) => {
            const reader = new FileReader();
            
            reader.addEventListener("load", (event) => {
                const otm = JSON.parse((event.target as FileReader).result as string) as OtmJson;
                otm.dictionaryName = value.name;
                this.otmlist.push(otm);
            })

            reader.readAsText(value);
        });
    };

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
            case OtmViewer.MatchType.REGEXP:
                filterFunc = (y: OtmWord) => y.entry.form.match(searchWord) !== null;
                break;
            default:
                filterFunc = (y: OtmWord) => y.entry.form.indexOf(searchWord) !== -1;
                break;
        }

        return this.getResult(filterFunc);
    }

    private searchTranslations(): ViewResult[] {
        const searchWord = this.searchWord();
        let filterFunc: ((y: OtmWord) => boolean) | null = null;

        switch (this.matchType()) {
            case OtmViewer.MatchType.FORWARD:
                filterFunc = (y: OtmWord) => y.translations.some(z => z.forms.findIndex(w => w.startsWith(searchWord)) !== -1);
                break;
            case OtmViewer.MatchType.BACKWARD:
                filterFunc = (y: OtmWord) => y.translations.some(z => z.forms.findIndex(w => w.endsWith(searchWord)) !== -1);
                break;
            case OtmViewer.MatchType.REGEXP:
                filterFunc = (y: OtmWord) => y.translations.some(z => z.forms.findIndex(w => w.match(searchWord) !== null) !== -1);
                break;
            default:
                filterFunc = (y: OtmWord) => y.translations.some(z => z.forms.findIndex(w => w.indexOf(searchWord) !== -1) !== -1);
                break;
        }

        return this.getResult(filterFunc);
    }

    private searchAll(): ViewResult[] {
        const searchWord = this.searchWord();
        let filterFunc: ((y: OtmWord) => boolean) | null = null;

        switch (this.matchType()) {
            case OtmViewer.MatchType.FORWARD:
                filterFunc = (y: OtmWord) => {
                    return y.entry.form.startsWith(searchWord) ||
                        y.translations.some(z => z.forms.findIndex(w => w.startsWith(searchWord)) !== -1) ||
                        y.contents.some(z => z.text.startsWith(searchWord)) ||
                        y.variations.some(z => z.form.startsWith(searchWord));
                }
                break;
            case OtmViewer.MatchType.BACKWARD:
                filterFunc = (y: OtmWord) => {
                    return y.entry.form.endsWith(searchWord) ||
                        y.translations.some(z => z.forms.findIndex(w => w.endsWith(searchWord)) !== -1) ||
                        y.contents.some(z => z.text.endsWith(searchWord)) ||
                        y.variations.some(z => z.form.endsWith(searchWord));
                };;
                break;
            case OtmViewer.MatchType.REGEXP:
                filterFunc = (y: OtmWord) => {
                    return y.entry.form.match(searchWord) !== null ||
                        y.translations.some(z => z.forms.findIndex(w => w.match(searchWord) !== null) !== -1) ||
                        y.contents.some(z => z.text.match(searchWord) !== null) ||
                        y.variations.some(z => z.form.match(searchWord) !== null);
                };
                break;
            default:
                filterFunc = (y: OtmWord) => {
                    return y.entry.form.indexOf(searchWord) !== -1 ||
                        y.translations.some(z => z.forms.findIndex(w => w.indexOf(searchWord) !== -1) !== -1) ||
                        y.contents.some(z => z.text.indexOf(searchWord) !== -1) ||
                        y.variations.some(z => z.form.indexOf(searchWord) !== -1);
                };
                break;
        }

        return this.getResult(filterFunc);
    }

    private searchWordTags(): ViewResult[] {
        const searchWord = this.searchWord();
        let filterFunc: ((y: OtmWord) => boolean) | null = null;

        switch (this.matchType()) {
            case OtmViewer.MatchType.FORWARD:
                filterFunc = (y: OtmWord) => y.tags.some(z => z.startsWith(searchWord));
                break;
            case OtmViewer.MatchType.BACKWARD:
                filterFunc = (y: OtmWord) => y.tags.some(z => z.endsWith(searchWord));
                break;
            case OtmViewer.MatchType.REGEXP:
                filterFunc = (y: OtmWord) => y.tags.some(z => z.match(searchWord) !== null);
                break;
            default:
                filterFunc = (y: OtmWord) => y.tags.some(z => z.indexOf(searchWord) !== -1);
                break;
        }

        return this.getResult(filterFunc);
    }

    private searchTranslationTags() {
        const searchWord = this.searchWord();
        let filterFunc: ((y: OtmWord) => boolean) | null = null;

        switch (this.matchType()) {
            case OtmViewer.MatchType.FORWARD:
                filterFunc = (y: OtmWord) => y.translations.some(z => z.title.startsWith(searchWord));
                break;
            case OtmViewer.MatchType.BACKWARD:
                filterFunc = (y: OtmWord) => y.translations.some(z => z.title.endsWith(searchWord));
                break;
            case OtmViewer.MatchType.REGEXP:
                filterFunc = (y: OtmWord) => y.translations.some(z => z.title.match(searchWord) !== null);
                break;
            default:
                filterFunc = (y: OtmWord) => y.translations.some(z => z.title.indexOf(searchWord) !== -1);
                break;
        }

        return this.getResult(filterFunc);
    }

    private getResult(filterFunc: (y: OtmWord) => boolean): ViewResult[] {
        if(filterFunc === null) {
            return [];
        }
        else {
            const result = this.otmlist.map((x) => x.words.filter(filterFunc as (y: OtmWord) => boolean).map((y) => {
                return {
                    name: x.dictionaryName,
                    word: y,
                } as ViewResult;
            }));

            if(result.length !== 0) {
                return result.reduce((acc, x) => acc.concat(x)).sort((x, y) => {
                    if(x.word.entry.form < y.word.entry.form) { return -1; }
                    else if(x.word.entry.form > y.word.entry.form) { return 1; }
                    else { return 0; }
                });
            }
            else {
                return [];
            }
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
        ALL: "all",
        WORD_TAG: "wordTag",
        TRANSLATION_TAG: "translationTag",
    };

    static MatchType = {
        FORWARD: "forward",
        BACKWARD: "backward",
        PARTIAL: "partial",
        REGEXP: "regexp"
    };
    
    static SearchTypeList = [
        { name: "単語検索", value: OtmViewer.SearchType.WORD },
        { name: "訳語検索", value: OtmViewer.SearchType.TRANSLATION },
        { name: "全文検索", value: OtmViewer.SearchType.ALL },
        { name: "単語タグ検索", value: OtmViewer.SearchType.WORD_TAG },
        { name: "訳語タグ検索", value: OtmViewer.SearchType.TRANSLATION_TAG}
    ];

    static MatchTypeList = [
        { name: "前方一致", value: OtmViewer.MatchType.FORWARD },
        { name: "後方一致", value: OtmViewer.MatchType.BACKWARD },
        { name: "部分一致", value: OtmViewer.MatchType.PARTIAL },
        { name: "正規表現", value: OtmViewer.MatchType.REGEXP },
    ];
}