let editorSent;
let editorResponse;

let transitionLayout;

const expandHeight = 36;

const darkMode = window.parent.document.body.classList.contains('-theme-with-dark-background');

if (darkMode)
    document.body.classList.add('dark-mode');

const app = new Vue({
    el   : 'header',
    data : {
        active       : -1,
        expand       : false,
        expandHeight : expandHeight,
        requests     : []
    },
    methods: {
        show: function(request, index) {
            app.active = index;

            updateMonaco(request.message, request.response);
        },

        expandable: function() {
            app.expand = !app.expand

            let size = document.querySelector('.history-container').scrollHeight;

            app.expandHeight = (app.expand) ? ((size < expandHeight) ? expandHeight : size) : expandHeight;

            clearTimeout(transitionLayout);

            transitionLayout = setTimeout(() => {
                if (editorSent !== undefined)
                    editorSent.layout();

                if (editorResponse !== undefined)
                    editorResponse.layout();
            }, 510)
        }
    }
})

function updateMonaco(sent, response) {
    sent     = JSON.stringify(sent,     null, 4);
    response = JSON.stringify(response, null, 4);

    if (editorSent === undefined) {
        editorSent = monaco.editor.create(document.querySelector("#editorSent"), {
            language             : "json",
            readOnly             : true,
            scrollBeyondLastLine : false,
            theme                : (darkMode) ? "vs-dark" : "vs",
            value                : sent
        });
    } else {
        editorSent.setValue(sent);
        editorSent.layout();
    }

    if (editorResponse === undefined) {
        editorResponse = monaco.editor.create(document.querySelector("#editorResponse"), {
            language             : "json",
            readOnly             : true,
            scrollBeyondLastLine : false,
            theme                : (darkMode) ? "vs-dark" : "vs",
            value                : response
        });
    } else {
        editorResponse.setValue(response);
        editorResponse.layout();
    }
}

function requestHandler(request) {
    app.requests.push(request);

    if (app.active === app.requests.length - 2) {
        app.active = app.requests.length - 1;

        updateMonaco(app.requests[app.active].message, app.requests[app.active].response);
    }

    Vue.nextTick(() => {
        let size = document.querySelector('.history-container').scrollHeight;

        app.expandHeight = (app.expand) ? ((size < expandHeight) ? expandHeight : size) : expandHeight;
    })
}

window.addEventListener("resize", () => {
    if (editorSent !== undefined)
        editorSent.layout();

    if (editorResponse !== undefined)
        editorResponse.layout();

    let size = document.querySelector('.history-container').scrollHeight;

    app.expandHeight = (app.expand) ? ((size < expandHeight) ? expandHeight : size) : expandHeight;

    transitionLayout = setTimeout(() => {
        if (editorSent !== undefined)
            editorSent.layout();

        if (editorResponse !== undefined)
            editorResponse.layout();
    }, 510)
});