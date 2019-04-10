# Variables are scoped

Variables are visible in a block that they are in.
That means that this block is in their scope.

[#](../../flow/block.md)

Variables are also visible in scopes inside their scope.
Nested blocks share scope properties with those that they are nested in.

```javascript
{
  let fruit = "apple";
  {
    fruit = "orange"; // ✔️ OK!
  }
}
```

Variables are not visible in scopes outside of their own.
Neither neighbouring nor containing one.

```javascript
{
  {
    let fruit = "apple";
  }
  fruit = "orange"; // ❌ BAD!
}
```

```javascript
{
  let fruit = "apple";
}
{
  fruit = "orange"; // ❌ BAD!
}
```
