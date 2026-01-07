const sse = new EventSource('http://localhost:5001/notification');

sse.onmessage = function (event) {
    console.log(event.data);
};
