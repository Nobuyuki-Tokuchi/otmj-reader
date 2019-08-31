(function () {
    ko.bindingHandlers["selected"] = {
        init: bindingSelected,
        update: bindingSelected,
    }

    function bindingSelected (element: HTMLElement, valueAccessor: () => any) {
        const value = valueAccessor();
        const unwrapValue = ko.unwrap(value);
        const tabValue = element.getAttribute("data-tab-value") || "-1";

        const isEquals = unwrapValue == tabValue;
        if(isEquals && !element.classList.contains("active")) {
            element.classList.add("active");
        }
        else if (!isEquals && element.classList.contains("active")){
            element.classList.remove("active");
        }
    }

    ko.bindingHandlers["used"] = {
        init: bindingUsed,
        update: bindingUsed,
    }

    function bindingUsed (element: HTMLElement, valueAccessor: () => any) {
        const value = valueAccessor();
        const unwrapValue = ko.unwrap(value);
        const tabValue = element.getAttribute("data-tab-value") || "-1";

        const isEquals = unwrapValue == tabValue;
        if(isEquals && element.style.display === "none") {
            element.style.display = "";
        }
        else if(!isEquals && element.style.display !== "none") {
            element.style.display = "none";
        }
    }

    ko.components.register("input-file", {
        viewModel: {
            createViewModel: (params, componentInfo) => {
                const base = componentInfo.element;
                
                const input = document.createElement("input");
                input.type = "file";
                input.multiple = true;
                input.setAttribute("style", "display: none;");
                input.setAttribute("data-bind", "event: { change: changeFileList }");
                base.appendChild(input);
                
                const label = document.createElement("label");
                label.classList.add("panel", "p-w5");
                label.setAttribute("style", "display: block; border-style: dotted; border-width: 1px; height: 90%;");
                label.setAttribute("data-bind", "text: message, attr: { title: fileNames }, event: { click: open, drop: dropFiles, dragover: prevent }");
                base.appendChild(label);
                return new InputFileViewModel(params, input);
            }
        },
        template: {
            element: document.createElement("div"),
        },
    });

    class InputFileViewModel {
        private otmlist: KnockoutObservableArray<OtmJson>;
        private node: HTMLElement;
        message : KnockoutComputed<string>;
        fileNames: KnockoutComputed<string>;

        constructor(params: any, node: HTMLElement) {
            this.otmlist = params.value;
            this.node = node;
            this.message = ko.pureComputed(() => {
                const files = this.otmlist();
                const count = files.length;

                if(count === 0) {
                    return "ファイルが選択されていません。";
                }
                else {
                    return `${count}件のファイルが選択されています`;
                }
            });

            this.fileNames = ko.pureComputed(() => {
                return this.otmlist().map(x => x.dictionaryName).join("\n");
            });
        }

        changeFileList = (_: any, event: Event) => {
            let files: FileList | null = null;
            if(!(event.target instanceof HTMLInputElement)) {
                throw new TypeError("invalid elements");
            }

            files = event.target.files;

            if(files === null) {
                throw new ReferenceError("files is null");
            }

            this.setFileList(files);
        };

        open = (_: any, event: Event) => {
            this.node.click();
        }

        dropFiles = (_: any, event: DragEvent) => {
            event.preventDefault();

            if(event.dataTransfer) {
                this.setFileList(event.dataTransfer.files);
            }
        }

        prevent = (_: any, event: Event) => {
            event.preventDefault();
        }

        private setFileList(files: FileList): void {
            this.otmlist().length = 0;

            Array.from(files).forEach((value) => {
                const reader = new FileReader();
                
                reader.addEventListener("load", (event) => {
                    const otm = JSON.parse((event.target as FileReader).result as string) as OtmJson;
                    otm.dictionaryName = value.name;
                    this.otmlist.push(otm);
                })

                reader.readAsText(value);
            });
        }
    }
})()
