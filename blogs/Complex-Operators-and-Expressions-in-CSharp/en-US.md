# Complex operators and expressions in C#(CSharp)

[![en-US](https://img.shields.io/badge/lang-en--US-brightgreen)](./en-US) [![en-US](https://img.shields.io/badge/lang-zh--TW-brightgreen)](./zh-TW)

There is an interesting question:

> What will `x` be in the following expression?
>
> ```cs
> Int32 x = 1;
> x += ++x + x++;
> ```

Of course, this is obviously very poorly written and difficult to read. Although it is just entertainment or mind training here, we always have the opportunity to encounter such programs. Maybe it's reading someone else's bad code, or trying to decipher an obfuscated decompiled program, or an interview question.

In any case, I believe it is beneficial to understand how such code works. At least we can deeply understand many details about operators and expressions.

We will then try to simplify this complex calculation step by step, and learn how to read it and set out to reduce it to an easy-to-read form. (It should be noted that the simplification we mentioned means logical simplification. Their compiled output IL are not necessarily exactly equal. Therefore, it is necessary to fully test when implementing in a production environment.)

## Solve the problem

### Start with operator precedence

There are many operators in C#, here we focus on the part about mathematical calculations. For a complete priority table see [here](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/#operator-precedence). We list some of the operators we care about, starting with the highest precedence to the lowest:

Operators | Category
--- | ---
... | ...
`++x`、`--x`、`x++`、`x--`... | Unary
`x * y`、`x / y`、`x % y` | Multiplicative
`x + y`、`x - y` | Additive
`x << y`、`x >> y`... | Shift
... | ...
`x = y`、`x += y`、`x -= y`... | Assignment

This order is important, and we will refer to many details about this table over time.

### Assignments, especially compound assignments

We can find that the assignment operator has the lowest precedence. So obviously, the first thing we need to pay attention to should be the expression on the right side of the equal sign. But wait a minute, the situation is a bit special for [compound assignment](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/bitwise-and-shift-operators#compound-assignment) operators such as `+=`, `-=`, we can learn from the documentation:

> `x op= y` is equivalent to `x = x op y` except that `x` is only evaluated once.

There are a few details to note here, First `x op= y` is equivalent to `x = x op y` not `x = y op x`. This is very important, because if `y` is an expression that changes the value of `x`, evaluating `x` first or evaluating `y` first can lead to completely different results.

In addition, it should be pointed out that `x = x op y` should be more precisely `x = (x) op (y)`, for example:

```cs
Int32 n;

n = 1;
n += n << 1;
Console.WriteLine(n);
// 3

n = 1;
n = (n) + (n << 1);
Console.WriteLine(n);
// 3

n = 1;
n = n + n << 1; // equivalent to (n + n) << 1;
Console.WriteLine(n);
// 4
```

Finally, we can notice that "`x` is only evaluated once". This is a bit complicated, and we won't use this feature here. Also, in actual use, I don't recommend using such an "implicit" meaning to achieve the goal of evaluating `x` only once. So here, we will ignore it for now, and explain it later in the [Evaluation of expressions](#evaluation-of-expressions) section.

Ok, now that we understand how compound assignments work, our problem has been initially simplified:

```cs
x += ++x + x++;
// =>
x = (x) + (++x + x++);
```

### Evaluation of expressions

This part is relatively difficult, so you can skip it if you are confused.

In C#, operator precedence is not the same as [associativity](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/#operator-associativity). Parentheses in expressions clarify associativity, but do not change precedence.

The more important point is the [evaluation order of the operands](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/#operand-evaluation), which has nothing to do with the previous two. Operands in expressions are evaluated left-to-right without being affected by them.

That is, while the overall order of evaluation is different for a + (b *c) versus (a + b)* c, the order of evaluation of the operands will be the same.

Expression | Order of evaluation | Order of evaluation of operands
`a = b` | `a` `b` `=` | `a` `b`
`a + (b * c)` | `a` `b` `c` `*` `+` | `a` `b` `c`
`(a + b) * c` | `a` `b` `+` `c` `*` | `a` `b` `c`
`x += ++x + x++` | `x` `x` `++_` `x` `_++` `+` `+=` | `x` `x` `x`
`x = (x) + (++x + x++)` | `x` `x` `x` `++_` `x` `_++` `+` `+` `=` | `x` `x` `x` `x`

You may have noticed that we said earlier that the expressions for `x` in the table are equivalent, but the operands of the latter appear one more time. Or rather, one less of the former.

That's right, that's what the "except that `x` is only evaluated once" meaning said earlier.

This behavior usually has no effect, but for some operands with high overhead, or operands with side effects, you need to be very careful.

Here is an example of the difference between the two:

```cs
// a is here just to print the result, no side effects
Int32 a;
// custom data source
MyNumber m;

m = new MyNumber(1);
// GetNumber method is called once here
a = m.GetNumber().Number += 1;
Console.WriteLine(a);
// GetNumber() evaluated!
// 2

m = new MyNumber(1);
// GetNumber method is called twice here
a = m.GetNumber().Number = m.GetNumber().Number + 1;
Console.WriteLine(a);
// GetNumber() evaluated!
// GetNumber() evaluated!
// 2


class MyNumber{
  public MyNumber(Int32 n)
    => this._number = n;

  private Int32 _number;
  public Int32 Number {
    get => this._number;
    set => this._number = value;
  }

  // Simulate an operand that may be expensive or have side effects
  public MyNumber GetNumber() {
    Console.WriteLine("GetNumber() evaluated!");
    return this;
  }
}
```

Of course, there is also a way to avoid compound assignments and evaluate methods only once:

```cs
Int32 a;
MyNumber m;

m = new MyNumber(1);
var myNumber = m.GetNumber(); // GetNumber method evaluates here
a = myNumber.Number = myNumber.Number + 1;
Console.WriteLine(a);
// GetNumber() evaluated!
// 2
```

In fact, the `Number` property is still evaluated twice. We just use some tricks, namely temporary variables, to make critical parts evaluated only once.

> Although in some cases, `x = (x) OP (y)` is not equal to `x op = y`. However, the compiler is very clever, and it will automatically convert you into a relatively low-cost way in equal occasions.
>
> ```c
> // x += ++x + x++;
> // x = x + (++x + x++);
> // in this case, the effect is equivalent, so the latter will be compiled to convert to the former
>
> // results: x x ++_ x _++ + + =
>
> // x
> IL_0002: ldloc.0
> // x
> IL_0003: ldloc.0
> // ++_
> IL_0004: ldc.i4.1
> IL_0005: add
> IL_0006: dup
> IL_0007: stloc.0
> // x
> IL_0008: ldloc.0
> // _++
> IL_0009: dup
> IL_000a: ldc.i4.1
> IL_000b: add
> IL_000c: stloc.0
> // +
> IL_000d: add
> // +
> IL_000e: add
> // =
> IL_000f: stloc.0
> ```
>
> In the case where the above their effects is not equivalent, the function of only evaluating once is actually achieved by duplicating the value of stack, that is, the address of the target object.
>
> ```c
> // m.GetNumber().Number += 1;
>
> // results: GetNumber() dup .Number 1 + =
> //               ^-------^-----^--------^
>
> // GetNumber()
> IL_0007: ldloc.0
> IL_0008: callvirt instance class MyNumber MyNumber::GetNumber()
> // duplicate GetNumber() value
> IL_000d: dup
> // .Number
> IL_000e: callvirt instance int32 MyNumber::get_Number()
> // 1
> IL_0013: ldc.i4.1
> // +
> IL_0014: add
> // .Number =
> IL_0015: callvirt instance void MyNumber::set_Number(int32)
> IL_001a: nop
> ```
>
> The other:
>
> ```c
> // m.GetNumber().Number = m.GetNumber().Number + 1;
>
> // results: GetNumber() GetNumber() .Number 1 + =
> //               ^           ^---------^        ^
> //               |----------------------------- |
>
> // GetNumber()
> IL_0007: ldloc.0
> IL_0008: callvirt instance class MyNumber
> // GetNumber()
> MyNumber::GetNumber()
> IL_000d: ldloc.0
> IL_000e: callvirt instance class MyNumber MyNumber::GetNumber()
> // .Number
> IL_0013: callvirt instance int32 MyNumber::get_Number()
> // 1
> IL_0018: ldc.i4.1
> // +
> IL_0019: add
> // .Number =
> IL_001a: callvirt instance void MyNumber::set_Number(int32)
> IL_001f: nop
> ```

### Increment and decrement operators in complex expressions

I believe you already understand the specific behavior of increment and decrement operators, so here we start directly from the conclusion. Taking the increment operator as an example, we can know:

```cs
_ = n++;
// is similar to
_ = {return n, then let n = n + 1};

_ = ++n;
// is similar to
_ = {let n = n + 1, then return n};
```

Then how should it be understood if it appears multiple times in an expression at the same time? Again we start with a simple example:

```cs
var n = 1;

var a = ++n; // n becomes 2 here, a is 2
var b = n++; // n becomes 3 here, b is 2

n = a + b; // n becomes a + b here
           // it doesn't matter what the original value of n is
           // that just assigns a + b to n
```

First, we use the increment operator on `n` twice in sequence, which actually changes `n`. And we store their respective callback values. We can see that the effect is cumulative when the increment operator is applied sequentially to the same variable.

Then we know that expressions are evaluated sequentially as well. Therefore, we can easily extend it to complex expressions:

```cs
var n = 1;

var tmp = ++n + n++;
//   ^     ^     ^
//(a + b) (a)   (b)

n = tmp;
//   ^
//(a + b)
```

The `n++` on the left is first evaluated. This increments `n` itself and also returns a value. Then, in the same way, `n++` on the right is evaluated. We write this process in steps:

```cs
// var n = 1;

var tmp = ++n + n++; // n = 1
//        ++1
// evaluate the ++n on the left, notice that the value of n is also changed!
var tmp = 2 + n++; // n = 2
//            2++
// then, evaluate the n++ on the right
var tmp = 2 + 2; // n = 3
// we got the value of tmp!
var tmp = 4;

// finally, assign tmp to n
n = tmp;
```

Of course, we can also find that this `tmp` is actually redundant. I'm using it here just to make the expression less confusing. But now, you can remove it and try again:

```cs
// var n = 1;

n = ++n + n++; // n = 1
n = 2 + n++; // n = 2
n = 2 + 2; // n = 3
n = 4;
```

Perfect.

### Back to the question

Alright, back to the original question. We have initially simplified the expression previously. Since the assignment operator `=` is evaluated last, let's focus on the right-hand side of the expression:

```cs
(x) + (++x + x++);
```

We know from the evaluation rules of expressions that the operands are first evaluated from left to right for this expression. We will temporarily label different `n` as `x_n` respectively.

```cs
(x_1) + (++x_2 + x_3++);
```

The evaluation process will look like this: `x_1` `x_2` `++_` `x_3` `_++` `+` `+`.

This looks a bit complicated. If you have read [Evaluation of expressions](#evaluation-of-expressions), then you should be able to understand the meaning of this order.

In short, we evaluate `x_1` first, then `++x_2`, and finally `x_3++`. Then `++x_2` will be added to `x_3++`, and finally `x_1` will be also added. Just swap `x_n` back to `x`, and let's go step by step:

```cs
// var x = 1;

(x) + (++x + x++) // x = 1
// evaluate x
1 + (++x + x++) // x = 1
// evaluate ++x
1 + (2 + x++) // x = 2
// evaluate x++
1 + (2 + 2) // x = 3
// evaluate (++x + x++)
1 + 4
// evaluate x + (...)
5
```

Now, to solve the whole problem:

```cs
// Int32 x = 1;

x += ++x + x++; // x = 1
x = (x) + (++x + x++); // x = 1
x = 1 + (++x + x++); //x = 1
x = 1 + (2 + x++); // x = 2
x = 1 + (2 + 2); // x = 3
x = 5;
```

Of course, since this is all addition, the parentheses can be removed.

## More generic cases

### If we don't know the value of x

In most programs, values like `x` are obtained at runtime. So the key to the problem is how to understand the effect of such expressions during runtime.

So, let's slightly modify the original question:

```cs
public Int32 hackAdd(Int32 x) {
  x += ++x + x++;
  return x;
}
```

Here, we need to use algebra to represent the actual state of `x`. We agree that `x = (x + 1)` means that the variable `x` currently stores a value likes `x + 1`. Then, do it again:

```cs
// Int32 x = (x);

x += ++x + x++; // x = (x)
// simplify
x = (x) + (++x + x++); // x = (x)
//   ^
// evaluate it
x = x + (++x + x++); // x = (x)
//        ^
//    evaluate it
x = x + ((x+1) + x++); // x = (x + 1)
//                ^
//            evaluate it
x = x + ((x+1) + (x+1)); // x = (x + 2)
// it's all addition so we remove the parentheses
x = x + x + 1 + x + 1;
x = (3 * x) + 2;

// return x;
```

Problem solved:

```cs
public Int32 hackAdd(Int32 x) => normalAdd(x);
public Int32 normalAdd(Int32 x) => (3 * x) + 2;
```

Another more complex example:

```cs
public Int32 hackSub(Int32 x) {
  x += ++x - x-- * x++;
  return x;
}
```

In the same way:

```cs
// Int32 x = (x);

x += ++x - x-- * x++; // x = (x)
x = (x) + (++x - x-- * x++); // x = (x)
x = x + (++x - x-- * x++); // x = (x)
x = x + ((x+1) - x-- * x++); // x = (x+1)
x = x + ((x+1) - (x+1) * x++); // x = (x)
x = x + ((x+1) - (x+1) * x); // x = (x+1)
x = x + x + 1 - (x + 1) * x;
x = x + x + 1 - (x * x) - x;
x = x - (x * x) + 1;

// return x
```

```cs
public Int32 hackSub(Int32 x) => normalSub(x);
public Int32 normalSub(Int32 x) => x - (x * x) + 1;
```

### Such expressions in C/C++

First of all, as C# is a C-like language, we may care about the output of such expressions in C/C++.

Unfortunately, however, these rules only apply to C#. Even further, such an expression should never appear in C/C++. Similar expressions can even have completely different outputs in different C/C++ compilers.

```cpp
#include<iostream>

int main() {
  auto a = 1;
  a += ++a + a++;
  std::cout << a;
  return 0;
}

// MSVC: 7
// nvc++: 8
// clang: 7
// gcc: 8
```

## Acknowledgments

I've long been interested in complex expressions in C# and C/C++, but [a tweet](https://twitter.com/jerrynixon/status/1599887244453908480) from [Jerry Nixon](https://twitter.com/jerrynixon) gave me the impetus to write this blog.

In addition, [SharpLab](https://sharplab.io/) and [godbolt](https://godbolt.org/) provide powerful tools that allow me to easily test in different environments.
