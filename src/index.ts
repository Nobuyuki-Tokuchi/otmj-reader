window.addEventListener("load", () => {
    const viewer = new OtmViewer();

    ko.applyBindings(viewer, document.getElementById("main"));
});