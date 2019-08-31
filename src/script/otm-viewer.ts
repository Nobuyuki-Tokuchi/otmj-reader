
interface ViewResult {
    name: string;
    word: OtmWord;
}

interface LoadedDictionary {
    name: string;
    isTarget: KnockoutObservable<boolean>;
}

type SearchFunction = (word: OtmWord) => boolean;

class OtmViewer {
    otmlist: KnockoutObservableArray<OtmJson>;
    results: KnockoutObservableArray<ViewResult>;
    searchWord: KnockoutObservable<string>;
    searchType: KnockoutObservable<string>;
    matchType: KnockoutObservable<string>;
    count: KnockoutComputed<number>;
    readFileInfoList: KnockoutObservableArray<LoadedDictionary>;
    selected: KnockoutObservable<string>;
    scriptFunc: KnockoutObservable<string>;
    otmSearchScript: KnockoutObservable<string>;

    constructor() {
        this.otmlist = ko.observableArray([]);
        this.results = ko.observableArray([]);
        this.searchWord = ko.observable("");
        this.searchType = ko.observable(OtmViewer.SearchType.WORD);
        this.matchType = ko.observable(OtmViewer.MatchType.FORWARD);
        this.count = ko.pureComputed(() => this.results().length);
        this.readFileInfoList = ko.observableArray([]);
        this.selected = ko.observable("1");
        this.scriptFunc = ko.observable("");
        this.otmSearchScript = ko.observable("");

        ko.computed(() => {
            this.readFileInfoList(this.otmlist().map(x => {
                return {
                    name: x.dictionaryName!,
                    isTarget: ko.observable(true),
                };
            }));    
        })
    }

    public tabClick(_data: any, event: Event) {
        const target = event.target as (HTMLElement | null);
        if(target === null) {
            throw new TypeError("event target is nothing");
        }

        if(!(target instanceof HTMLButtonElement)) {
            return ;
        }

        const valueAttr = target.attributes.getNamedItem("data-tab-value");
        if(valueAttr === null) {
            return ;
        }

        this.selected(valueAttr.value);
    }
    
    public search(): void {
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

    public searchScript(): void {
        if(this.selected() === "2") {
            const data = this.otmSearchScript();
            if(typeof(data) === "string" && data !== "") {
                const search = new OtmSearch(data);
                this.results(this.getResult(search.compile() as SearchFunction));
            }
        }
        else {
            const data = this.scriptFunc();
            if(typeof(data) === "string" && data !== "") {
                const func = new Function("word", data);
                this.results(this.getResult(func as SearchFunction));
            }
        }
    }

    private searchWords(): ViewResult[] {
        const searchWord = this.searchWord();
        let filterFunc: ((word: OtmWord) => boolean) | null = null;

        switch (this.matchType()) {
            case OtmViewer.MatchType.FORWARD:
                filterFunc = (word: OtmWord) => word.entry.form.startsWith(searchWord);
                break;
            case OtmViewer.MatchType.BACKWARD:
                filterFunc = (word: OtmWord) => word.entry.form.endsWith(searchWord);
                break;
            case OtmViewer.MatchType.REGEXP:
                filterFunc = (word: OtmWord) => word.entry.form.match(searchWord) !== null;
                break;
            default:
                filterFunc = (word: OtmWord) => word.entry.form.indexOf(searchWord) !== -1;
                break;
        }

        return this.getResult(filterFunc);
    }

    private searchTranslations(): ViewResult[] {
        const searchWord = this.searchWord();
        let filterFunc: ((word: OtmWord) => boolean) | null = null;

        switch (this.matchType()) {
            case OtmViewer.MatchType.FORWARD:
                filterFunc = (word: OtmWord) => word.translations.some(z => z.forms.findIndex(w => w.startsWith(searchWord)) !== -1);
                break;
            case OtmViewer.MatchType.BACKWARD:
                filterFunc = (word: OtmWord) => word.translations.some(z => z.forms.findIndex(w => w.endsWith(searchWord)) !== -1);
                break;
            case OtmViewer.MatchType.REGEXP:
                filterFunc = (word: OtmWord) => word.translations.some(z => z.forms.findIndex(w => w.match(searchWord) !== null) !== -1);
                break;
            default:
                filterFunc = (word: OtmWord) => word.translations.some(z => z.forms.findIndex(w => w.indexOf(searchWord) !== -1) !== -1);
                break;
        }

        return this.getResult(filterFunc);
    }

    private searchAll(): ViewResult[] {
        const searchWord = this.searchWord();
        let filterFunc: ((word: OtmWord) => boolean) | null = null;

        switch (this.matchType()) {
            case OtmViewer.MatchType.FORWARD:
                filterFunc = (word: OtmWord) => {
                    return word.entry.form.startsWith(searchWord) ||
                        word.translations.some(z => z.forms.findIndex(w => w.startsWith(searchWord)) !== -1) ||
                        word.contents.some(z => z.text.startsWith(searchWord)) ||
                        word.variations.some(z => z.form.startsWith(searchWord));
                }
                break;
            case OtmViewer.MatchType.BACKWARD:
                filterFunc = (word: OtmWord) => {
                    return word.entry.form.endsWith(searchWord) ||
                        word.translations.some(z => z.forms.findIndex(w => w.endsWith(searchWord)) !== -1) ||
                        word.contents.some(z => z.text.endsWith(searchWord)) ||
                        word.variations.some(z => z.form.endsWith(searchWord));
                };;
                break;
            case OtmViewer.MatchType.REGEXP:
                filterFunc = (word: OtmWord) => {
                    return word.entry.form.match(searchWord) !== null ||
                        word.translations.some(z => z.forms.findIndex(w => w.match(searchWord) !== null) !== -1) ||
                        word.contents.some(z => z.text.match(searchWord) !== null) ||
                        word.variations.some(z => z.form.match(searchWord) !== null);
                };
                break;
            default:
                filterFunc = (word: OtmWord) => {
                    return word.entry.form.indexOf(searchWord) !== -1 ||
                        word.translations.some(z => z.forms.findIndex(w => w.indexOf(searchWord) !== -1) !== -1) ||
                        word.contents.some(z => z.text.indexOf(searchWord) !== -1) ||
                        word.variations.some(z => z.form.indexOf(searchWord) !== -1);
                };
                break;
        }

        return this.getResult(filterFunc);
    }

    private searchWordTags(): ViewResult[] {
        const searchWord = this.searchWord();
        let filterFunc: ((word: OtmWord) => boolean) | null = null;

        switch (this.matchType()) {
            case OtmViewer.MatchType.FORWARD:
                filterFunc = (word: OtmWord) => word.tags.some(z => z.startsWith(searchWord));
                break;
            case OtmViewer.MatchType.BACKWARD:
                filterFunc = (word: OtmWord) => word.tags.some(z => z.endsWith(searchWord));
                break;
            case OtmViewer.MatchType.REGEXP:
                filterFunc = (word: OtmWord) => word.tags.some(z => z.match(searchWord) !== null);
                break;
            default:
                filterFunc = (word: OtmWord) => word.tags.some(z => z.indexOf(searchWord) !== -1);
                break;
        }

        return this.getResult(filterFunc);
    }

    private searchTranslationTags() {
        const searchWord = this.searchWord();
        let filterFunc: ((word: OtmWord) => boolean) | null = null;

        switch (this.matchType()) {
            case OtmViewer.MatchType.FORWARD:
                filterFunc = (word: OtmWord) => word.translations.some(z => z.title.startsWith(searchWord));
                break;
            case OtmViewer.MatchType.BACKWARD:
                filterFunc = (word: OtmWord) => word.translations.some(z => z.title.endsWith(searchWord));
                break;
            case OtmViewer.MatchType.REGEXP:
                filterFunc = (word: OtmWord) => word.translations.some(z => z.title.match(searchWord) !== null);
                break;
            default:
                filterFunc = (word: OtmWord) => word.translations.some(z => z.title.indexOf(searchWord) !== -1);
                break;
        }

        return this.getResult(filterFunc);
    }

    private searchVariationTags() {
        const searchWord = this.searchWord();
        let filterFunc: ((word: OtmWord) => boolean) | null = null;

        switch (this.matchType()) {
            case OtmViewer.MatchType.FORWARD:
                filterFunc = (word: OtmWord) => word.variations.some(z => z.title.startsWith(searchWord));
                break;
            case OtmViewer.MatchType.BACKWARD:
                filterFunc = (word: OtmWord) => word.variations.some(z => z.title.endsWith(searchWord));
                break;
            case OtmViewer.MatchType.REGEXP:
                filterFunc = (word: OtmWord) => word.variations.some(z => z.title.match(searchWord) !== null);
                break;
            default:
                filterFunc = (word: OtmWord) => word.variations.some(z => z.title.indexOf(searchWord) !== -1);
                break;
        }

        return this.getResult(filterFunc);
    }

    private getResult(filterFunc: SearchFunction): ViewResult[] {
        if(filterFunc === null) {
            return [];
        }
        else {
            const showDictionary = this.readFileInfoList().filter(x => x.isTarget()).map(x => x.name);
            const result = this.otmlist().filter(x => showDictionary.indexOf(x.dictionaryName) !== -1)
                .map((x) => x.words.filter(filterFunc).map((y) => {
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
        VARIATION_TAG: "variationTag",
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
        { name: "訳語タグ検索", value: OtmViewer.SearchType.TRANSLATION_TAG },
        { name: "変化形タグ検索", value: OtmViewer.SearchType.VARIATION_TAG },
    ];

    static MatchTypeList = [
        { name: "前方一致", value: OtmViewer.MatchType.FORWARD },
        { name: "後方一致", value: OtmViewer.MatchType.BACKWARD },
        { name: "部分一致", value: OtmViewer.MatchType.PARTIAL },
        { name: "正規表現", value: OtmViewer.MatchType.REGEXP },
    ];
}