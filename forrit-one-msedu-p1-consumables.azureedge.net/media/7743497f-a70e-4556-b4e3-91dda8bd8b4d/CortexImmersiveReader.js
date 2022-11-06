 function launchImmersiveReader() {
    var text = document.getElementById('txtImmersiveReader').value;
    var content = {
        title: "Immersive Reader",
        chunks: [{
            content: text
        }]
    };
    var token = "<%= token %>";
    //If token is an empty field, fallback to One Note Learning Tools page
    if (token !== "") {
        ImmersiveReader.launchAsync(token, content, { uiZIndex: 1000000 });
    } else {
        window.open('https://www.onenote.com/learningtools', '_blank');
    }
}