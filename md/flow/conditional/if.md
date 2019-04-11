# Use `if` statement to decide should some code block run

The correct way of specifying if statement is as follows:

```javascript
if (/* CONDITION */) /* BLOCK */
```

For example:

```javascript
if (shouldCodeRun) {
  runTheCode();
}
```

---

## `if` + `else`

You can also specify what should happen if the condition is not met

```javascript
if (shouldCodeRun) {
  runTheCode();
} else {
  runSomeOtherCode();
}
```

---

## `if` + `else` + `if` + `else` + ... + `else`

You can chain `if` statements, so there are several conditions checked one by one until one of them is met and the block after the condition is executed

```javascript
if (text == "a") {
  runInCaseOfA();
} else if (text == "b") {
  runInCaseOfB();
} else if (text == "c") {
  runInCaseOfC();
} else {
  runInOtherCase();
}
```

So if `text` is equal to `"b"`, only `runInCaseOfB` function is run.

ℹ️ Last `else { ... }` case is optional, just as in first discussed setup
