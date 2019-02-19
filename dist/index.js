"use strict";
let viewer;
window.addEventListener("load", () => {
    const inputFiles = document.getElementById("input-files");
    viewer = new OtmViewer();
    inputFiles.addEventListener("change", (event) => {
        let files = null;
        if (!(event.target instanceof HTMLInputElement)) {
            throw new TypeError("invalid elements");
        }
        files = event.target.files;
        if (files === null) {
            throw new ReferenceError("files is null");
        }
        viewer.readFiles(files);
    });
    ko.applyBindings(viewer, document.getElementById("main"));
});
//# sourceMappingURL=index.js.map