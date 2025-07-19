We always write JavaScript and Typescript code with double quotes for strings, four spaces for indentation, and no semicolons at the end of lines.  To repeat, do not put semicolons at the end of lines.

Always use curly braces around code blocks, even for single-line statements.  BAD: `if (condition) doSomething();` GOOD: `if (condition) { doSomething(); }`

Use traditional function declarations instead of arrow functions saved with `const` or `let`.  (Arrow functions are still OK for anonymous functions that aren't being saved to a variable, such as when passing a function as an argument to another function)  BAD: `const myFunction = () => { ... };` GOOD: `function myFunction() { ... }`; `[].map((item) => { ... })` is still OK, as is `useEffect(() => { ... }, [])`.
