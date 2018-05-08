JsStore provides two options for returning results - OnSuccess and OnError either as query or as callback. Some developers dont like to use callback and prefers promise. Thats why JsStore also provides Promise support.

JsStore returns promise when you dont specify the OnSuccess function. Lets take a look at below query -

JsStore

```
Connection.select({
    From: "Table_Name",
}).then(function(results) {
    console.log(results);
}).catch(function(error) {
    alert(error._message);
});
```

[Example](/example/promise) [Next](#)