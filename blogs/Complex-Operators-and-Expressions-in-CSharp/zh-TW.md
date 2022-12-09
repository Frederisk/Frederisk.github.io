# C# 中複雜運算子和運算式

[![en-US](https://img.shields.io/badge/lang-en--US-brightgreen)](./en-US) [![en-US](https://img.shields.io/badge/lang-zh--TW-brightgreen)](./zh-TW)

有這樣一個有趣的問題：

> 下列表達式中的 `x` 在最終會是多少？
>
> ```cs
> Int32 x = 1;
> x += ++x + x++;
> ```

當然，這顯然是非常糟糕並且難以閱讀的寫法，雖然在這兒只是娛樂或者說思維訓練，不過我們總是有機會遇到這樣的程式。或許是閱讀別人留下的糟糕程式碼，或者是嘗試解讀遭到混淆的反編譯程式，又或者是面試問題。

總之無論如何，我相信了解這樣的程式的運行原理至少是有益的，至少我們可以從中深刻理解有關運算子和運算式的許多細節。

我們接下來會一步一步嘗試簡化這個複雜的運算式，並學會如何閱讀並著手將其簡化為易於閱讀的形式。（需要注意，我們所提的簡化意味著邏輯上的簡化，它們的編譯產出 IL 並不一定完全相等，所以在生產環境中實施時務必做好充分的測試。）

## 解決問題

### 從運算子優先級開始

C# 中的運算子非常多，在此處我們專注於有關數學計算的部分，對於完整的優先級表格可以參見[此處](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/#operator-precedence)，我們從最高優先順序開始到最低優先順序列出一些我們所關心的運算子：

運算子 | 類別
--- | ---
... | ...
`++x`、`--x`、`x++`、`x--`... | 一元
`x * y`、`x / y`、`x % y` | 乘除
`x + y`、`x - y` | 加減
`x << y`、`x >> y`... | 移位
... | ...
`x = y`、`x += y`、`x -= y`... | 指派

這個順序很重要，我們接下來隨時會提到有關此表格的許多細節。

### 指派，尤其是複合指派

我們可以發現指派運算子的優先度是最低的，所以很顯然，我們最先需要關注的應該是等號右邊的運算式。但是先等一下，對於類如 `+=`、`-=` 這種[複合指派](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/bitwise-and-shift-operators#compound-assignment)算子而言情況有些特別，我們根據文件可以了解到：

> `x op= y` 相當於 `x = x op y`，但 `x` 只會評估一次。

這兒有一些細節需要注意，首先 `x op= y` 相當於 `x = x op y` 而不是 `x = y op x`。這非常重要，因為如果 `y` 是一個會改變 `x` 的值的運算式，那麼先評估 `x` 還是先評估 `y` 會導致完全不同的結果。

此外需要指出的是 `x = x op y` 更確切來說應該是 `x = (x) op (y)`，舉個例子：

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
n = n + n << 1; // 相當於 (n + n) << 1;
Console.WriteLine(n);
// 4
```

最後，我們可以注意到 `x` 只會評估一次，這略為有些複雜，在此處我們不會用到這一特徵，而且在實際使用中我也並不推薦用這樣「隱含」的意義來實現對 `x` 只評估一次的目標，所以在此處，我們暫時會忽略它，並在之後的[表達式的評估](#表達式的評估)部分對此加以說明。

好了，我們現在已經了解了複合指派是如何工作的了，我們的問題也得到了初步的簡化：

```cs
x += ++x + x++;
// =>
x = (x) + (++x + x++);
```

### 表達式的評估

這一部分相對艱深，如果你對這一部分感到困惑則可以跳過。

在 C# 中，運算子優先順序與運算子的[關聯性](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/#operator-associativity)是不同的，運算式中的括號會明確關聯性而並不會改變優先順序。

更重要的一點是運算元的[評估順序](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/#operand-evaluation)，這與前兩者都無關，運算式中的運算元會**由左至右評估**而不受它們的影響。

也就是說，雖然對於 `a + (b * c)` 與 `(a + b) * c` 來說，它們的整體評估順序是不同的，但運算元評估順序會是相同的。

運算式 | 評估順序 | 運算元評估順序
---| --- | ---
`a = b` | `a` `b` `=` | `a` `b`
`a + (b * c)` | `a` `b` `c` `*` `+` | `a` `b` `c`
`(a + b) * c` | `a` `b` `+` `c` `*` | `a` `b` `c`
`x += ++x + x++` | `x` `x` `++_` `x` `_++` `+` `+=` | `x` `x` `x`
`x = (x) + (++x + x++)` | `x` `x` `x` `++_` `x` `_++` `+` `+` `=` | `x` `x` `x` `x`

也許你會注意到，我們之前說表格中有關 `x` 的表達式是等價的，但其中後者的運算元多出現了一次。或者更確切地說，是前者少了一次。沒錯，這就是之前所述的「但 `x` 只會評估一次」的意義。這種行為在通常情況下不會產生影響，但是對於一些具有高開銷的運算元，或者有副作用的運算元來說則需要非常注意。

這裡有個案例說明兩者的不同：

```cs
// a 在此處只是為了列印結果，沒有副作用
Int32 a;
// 自訂的資料來源
MyNumber m;

m = new MyNumber(1);
// 呼叫了一次 GetNumber 方法
a = m.GetNumber().Number += 1;
Console.WriteLine(a);
// GetNumber() evaluated!
// 2

m = new MyNumber(1);
// 呼叫了兩次 GetNumber 方法
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

  // 模擬一個可能會有很大開銷或者有副作用的運算元
  public MyNumber GetNumber() {
    Console.WriteLine("GetNumber() evaluated!");
    return this;
  }
}
```

當然，也能夠有一種方案在避免使用複合指派的同時也只評估一次方法：

```cs
Int32 a;
MyNumber m;

m = new MyNumber(1);
var myNumber = m.GetNumber(); // GetNumber 方法在此處評估
a = myNumber.Number = myNumber.Number + 1;
Console.WriteLine(a);
// GetNumber() evaluated!
// 2
```

當然，實際上 `Number` 屬性還是評估了兩次。我們只是用了一些技巧，也就是臨時變數，來讓關鍵的部分只評估一次。

雖然在某些情況下 `x = (x) op (y)` 與 `x op= y` 並不相等。不過事實上編譯器很聰明，它會在相等的場合自動幫你轉化為相對低開銷的方式。

```c
// x += ++x + x++;
// x = x + (++x + x++);
// 在此例中等價，所以後者會在編譯中轉換為前者

// 編譯結果 x x ++_ x _++ + + =

// x
IL_0002: ldloc.0
// x
IL_0003: ldloc.0
// ++_
IL_0004: ldc.i4.1
IL_0005: add
IL_0006: dup
IL_0007: stloc.0
// x
IL_0008: ldloc.0
// _++
IL_0009: dup
IL_000a: ldc.i4.1
IL_000b: add
IL_000c: stloc.0
// +
IL_000d: add
// +
IL_000e: add
// =
IL_000f: stloc.0
```

在上面不等價的情況下，只評估一次的功能實際上這是透過複製（duplicate）堆疊的值來實現的，也就是複製目標物件的位置。

```c
// m.GetNumber().Number += 1;

// 編譯結果 GetNumber() dup .Number 1 + =
//             ^-------^-----^--------^

// GetNumber()
IL_0007: ldloc.0
IL_0008: callvirt instance class MyNumber MyNumber::GetNumber()
// duplicate GetNumber() value
IL_000d: dup
// .Number
IL_000e: callvirt instance int32 MyNumber::get_Number()
// 1
IL_0013: ldc.i4.1
// +
IL_0014: add
// .Number =
IL_0015: callvirt instance void MyNumber::set_Number(int32)
IL_001a: nop
```

另一個：

```c
// m.GetNumber().Number = m.GetNumber().Number + 1;

// 編譯結果 GetNumber() GetNumber() .Number 1 + =
//             ^           ^---------^        ^
//             |----------------------------- |

// GetNumber()
IL_0007: ldloc.0
IL_0008: callvirt instance class MyNumber MyNumber::GetNumber()
// GetNumber()
IL_000d: ldloc.0
IL_000e: callvirt instance class MyNumber MyNumber::GetNumber()
// .Number
IL_0013: callvirt instance int32 MyNumber::get_Number()
// 1
IL_0018: ldc.i4.1
// +
IL_0019: add
// .Number =
IL_001a: callvirt instance void MyNumber::set_Number(int32)
IL_001f: nop
```

### 複雜運算式中的遞增、遞減運算子

相信你已經了解遞增、遞減運算子的[具體行為](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/arithmetic-operators#increment-operator-)，所以在此處我們直接從結論開始。以遞增運算子為例，我們可以知道：

```cs
_ = n++;
// 類似於
_ = {return n, then let n = n + 1};

_ = ++n;
// 類似於
_ = {let n = n + 1, then return n};
```

然後如果在一個表達式中同時出現多次應該如何理解呢？同樣我們從一個簡單的例子開始：

```cs
var n = 1;

var a = ++n; // n 在此處變為 2，a 為 2
var b = n++; // n 在此處變為 3，b 為 2

n = a + b; // n 在此處變為 a + b
           // n 原來是多少並不重要
           // 這只是將 a + b 指派給 n
```

首先，我們依序對 `n` 用了兩次遞增運算子，這確實改變了 `n` ，並且我們儲存了它們各自的回傳值。我們可以發現，依序對同一個變數使用遞增運算子的話這種效果是會累積的。然後我們知道表達式的評估也是按照順序依次進行的，所以，我們很容易就能將其推廣到複雜運算式之中：

```cs
var n = 1;

var tmp = ++n + n++;
//   ^     ^     ^
//(a + b) (a)   (b)

n = tmp;
//   ^
//(a + b)
```

首先評估左邊的 `n++` 這使 `n` 本身增加了的同時也回傳了一個值。然後同理，評估右面的 `n++`。我們按照步驟寫出這個過程：

```cs
// var n = 1;

var tmp = ++n + n++; // n = 1
//        ++1
// 評估左邊的 ++n，注意 n 的值也改變了！
var tmp = 2 + n++; // n = 2
//            2++
// 然後，評估右邊的 n++
var tmp = 2 + 2; // n = 3
// 我們得到了 tmp！
var tmp = 4;

// 最後，把 tmp 指派給 n
n = tmp;
```

當然，我們也可以發現這個 `tmp` 其實是多餘的，我在此處使用它只是為了讓表達式看起來不那麼混亂。但現在，可以移除掉它並再試一次：

```cs
// var n = 1;

n = ++n + n++; // n = 1
n = 2 + n++; // n = 2
n = 2 + 2; // n = 3
n = 4;
```

完美。

### 回到問題

好了，回到最初的問題上。我們在先前已初步簡化了表達式，因為指派算子 `=` 是最後計算的，所以讓我們把注意力放在表達式的右端上：

```cs
(x) + (++x + x++);
```

從表達式的評估規則中我們可以知道，對於該表達式會首先從左至右評估運算元。我們將不同的 `n` 暫時分別標記為 `x_n`。

```cs
(x_1) + (++x_2 + x_3++);
```

我們的評估過程會是這樣：`x_1` `x_2` `++_` `x_3` `_++` `+` `+`。

這看起來有點複雜，如果你已經讀懂[表達式的評估](#表達式的評估)，那麼你應該可以理解這種順序的意義。簡而言之，我們會首先評估 `x_1`，然後是 `++x_2`，最後是`x_3++`。接著會把 `++x_2` 與 `x_3++`相加，最後把 `x_1` 也相加。好了，將 `x_n` 換回 `x`，然後我們一步步開始：

```cs
// var x = 1;

(x) + (++x + x++) // x = 1
// 評估 x
1 + (++x + x++) // x = 1
// 評估 ++x
1 + (2 + x++) // x = 2
// 評估 x++
1 + (2 + 2) // x = 3
// 評估 (++x + x++)
1 + 4
// 評估 x + (...)
5
```

現在，解決整個問題：

```cs
// Int32 x = 1;

x += ++x + x++; // x = 1
x = (x) + (++x + x++); // x = 1
x = 1 + (++x + x++); //x = 1
x = 1 + (2 + x++); // x = 2
x = 1 + (2 + 2); // x = 3
x = 5;
```

當然，由於此處都是加法，所以括號是可以移除的。

## 更為泛用的情況

### 如果我們不知道 x 的值

或許可以說，在絕大多數的程式中，類似 `x` 的值都是會在執行期得到的，所以這是問題的關鍵是如何理解這個表達式在執行期的效果。所以，我們略為修改一下最初的問題：

```cs
public Int32 hackAdd(Int32 x) {
  x += ++x + x++;
  return x;
}
```

這裡，我們需要使用代數來表示 `x` 的實際狀態，我們約定 `x = (x + 1)` 的含意是 `x` 這個變數目前存儲著的是 `x + 1` 這樣的值。然後，再來一次：

```cs
// Int32 x = (x);

x += ++x + x++; // x = (x)
// 簡化
x = (x) + (++x + x++); // x = (x)
//   ^
// 評估它
x = x + (++x + x++); // x = (x)
//        ^
//       評估它
x = x + ((x+1) + x++); // x = (x + 1)
//                ^
//               評估它
x = x + ((x+1) + (x+1)); // x = (x + 2)
// 簡化，全部是加法所以我們去除括號
x = x + x + 1 + x + 1;
x = (3 * x) + 2;

// return x;
```

問題解決，所以我們發現了 `hackAdd` 的通常寫法：

```cs
public Int32 hackAdd(Int32 x) => normalAdd(x);
public Int32 normalAdd(Int32 x) => (3 * x) + 2;
```

另一個更複雜的例子：

```cs
public Int32 hackSub(Int32 x) {
  x += ++x - x-- * x++;
  return x;
}
```

同樣：

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

### 在 C/C++ 中的此類運算式

首先，C# 作為類 C 的語言，我們可能會關心 C/C++ 中此類運算式的輸出。然而很遺憾，這些規則只適用於 C#。甚至更進一步來說，在 C/C++ 中是絕對不應該出現這樣的運算式的。類似的表達式在不同的 C/C++ 編譯器中甚至會有完全不同的輸出。

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

## 鳴謝

我在很早之前就出於興趣對 C# 與 C/C++ 中的複雜運算式有所了解，不過 [Jerry Nixon](https://twitter.com/jerrynixon) 的[一則推文](https://twitter.com/jerrynixon/status/1599887244453908480)使我擁有了撰寫本文的動力。

此外 [SharpLab](https://sharplab.io/) 與 [godbolt](https://godbolt.org/) 提供了強大的工具以讓我可以輕鬆地在不同環境中測試。
