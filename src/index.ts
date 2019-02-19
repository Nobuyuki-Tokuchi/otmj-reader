let viewer: OtmViewer;
window.addEventListener("load", () => {
    const inputFiles = document.getElementById("input-files") as HTMLInputElement;
    viewer = new OtmViewer();

    inputFiles.addEventListener("change", (event: Event) => {
        let files: FileList | null = null;
        if(!(event.target instanceof HTMLInputElement)) {
            throw new TypeError("invalid elements");
        }

        files = event.target.files;

        if(files === null) {
            throw new ReferenceError("files is null");
        }

        viewer.readFiles(files);
    })

    ko.applyBindings(viewer, document.getElementById("main"));
});