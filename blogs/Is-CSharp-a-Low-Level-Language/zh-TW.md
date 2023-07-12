# C#是低階語言嗎？

[![en-US-Source](https://img.shields.io/badge/lang-en--US--Source-blue)](https://mattwarren.org/2019/03/01/Is-CSharp-a-low-level-language/)[![zh-TW](https://img.shields.io/badge/lang-zh--TW--40%-yellow)](./zh-TW)

我是 [Fabien Sanglard](http://fabiensanglard.net/) 所做一切的忠實粉絲，我喜歡他的部落格並且從頭到尾讀了他的[兩本](http://fabiensanglard.net/gebbdoom/index.html)[著作](http://fabiensanglard.net/gebbwolf3d/index.html)（對於他的書的更多資訊，可以參考最近的 [Hansleminutes podcast](https://hanselminutes.com/666/episode-666-game-engine-black-book-doom-with-fabien-sanglard)）。

在最近，他寫了一篇精彩的文章，在其中他[破譯了一張明信片大小的光線追蹤器](http://fabiensanglard.net/postcard_pathtracer/index.html)，解開了其中受混淆的程式碼並且對其涉及的數學原理給出了精彩的解釋。我真心推薦你們花點時間去讀一下！

不過，這也讓我開始思考，**有無將 C++ 程式碼移植至 C# 的可能？**

其中一部分的原因是由於我的[日常工作](https://raygun.com/platform/apm)，我不得不編寫大量的 C++，並且我發現我開始有點生疏了，所以我想這樣做可能對我有所助益！

不過更為重要的是，我想更深入地去瞭解 **C# 是低階語言嗎？**

一個略有差異但有所相關的問題是「C#適合『系統程式設計』嗎？」對於有關此的更多內容我強烈推薦看看 Joe Duffy [在 2013 年發表的優秀文章](http://joeduffyblog.com/2013/12/27/csharp-for-systems-programming/)。

## 逐行移植

我開始將[反混淆的 C++ 程式碼](http://fabiensanglard.net/postcard_pathtracer/formatted_full.html)逐行移植為 [C#](https://gist.github.com/mattwarren/d17a0c356bd6fdb9f596bee6b9a5e63c)。而事實證明這非常簡單直接，我甚至在想說畢竟 C# 是 C++++ 的故事是真的！！

來看一個例子，程式中主要的資料結構是「vector」，把程式碼像這樣放在一起，左邊是 C++，右邊是 C#：

![對比 C++ 與 C# 的 struct Vec](./assets/Diff-Cpp-v-CSharp-struct-Vec.png)

語法差異當然是有的，不過由於 .NET 容許你自行定義自己的「實值型別」所以得到一樣的功能。這點很重要，將「vector」視為 `struct` 可以使其「資料區域性」更加優良，而且由於資料將進入「堆疊」而不需要涉及 .NET 的垃圾收集（GC）（大概如此，我知道這是個實現細節）。

對於.NET 中的 `struct` 或「實值型別」，可參見：

- 堆積 vs 堆疊、實值型別 vs 參考型別
- 實值型別 vs 參考型別
- .NET 中的記憶體 —— 都去哪兒了
- 實值型別的一些事實
- 堆疊是實作細節，第一部分

特別在最後那篇由 Eric Lippert 的最後一篇文章中有這樣一句十分有幫助的話，這清晰揭示了「實值型別」實際是甚麼：

> 當然，有關實值型別最相關的事實不是關於如何配置<!---->的實作細節，而是「實值型別」總是會「按值」拷貝的的設計語意。如果相關的事是它們的分配細節，那我們就會稱其為「堆疊型別」和「堆積型別」了。然而這在大多數時候並不相關，反之，最相關的是它們的拷貝語意與身分語意。

現在再讓我們看看一些其他方法並排比較的樣子（同樣，左邊是 C++，右邊是 C#），首先是 `RayTracing(..)`：

![對比 C++ 與 C# 的 RayMatching](./assets/Diff-Cpp-v-CSharp-RayMatching.png)

接下來是 `QueryDatabase(..)`：

![對比 C++ 與 C# 的 QueryDatabase（部分）](./assets/Diff-Cpp-vs-CSharp-QueryDatabase%20(partial).png)

（關於這兩個函式的作用的解釋，可參看 Fabien 的文章）

不過重點還是這個，C# 可以讓我們很容易寫出 C++ 的程式碼！在這時，幫助最大的是 `ref` 關鍵字，這壤我們可以將實值以參考的方式傳遞。我們可以在方法呼叫中使用 `ref` 的功能已經有很長一段時間了，但 C# 正在努力讓更多地方可以使用 `ref`：

- ref 回傳與 ref 局部變數
- C# 7 系列，第 9 部分：ref struct

現在，在某些情況下使用 `ref` 將使程式效能提高，因為 struct 在這些情況下不再需要拷貝，可以參考 Adam Sitniks 的文章以及 C# 中 ref 局部變數與 ref 回傳的效能陷阱以了解更多。

不過這種情形下最為重要的是，這一功能將容許我們在 C# 的移植過程中能夠得到與原始 C++ 程式碼相同的行為。不過我還是要指出，人們所知的「受管理參考」與「指標」並不完全等同，尤其是對於前者是不可以使用數學運算的，對於相關更多可參見：

- ref 的回傳不是指標
- 受管理指標
- 參考不是位址

## 效能

能夠移植程式碼固然很好，不過最終效能也很重要。尤其是類如「光線追蹤」的東西可能需要數分鐘來運作！在 C++ 的程式碼中有個叫 sampleCount 的變數可以控制圖像的最終品質，當設定 `sampleCount = 2` 時，結果看起來會像是這樣：

![C# 設定 sampleCount = 2 的輸出](./assets/output-CSharp-sampleCount-2.png)

這顯然談不上真實！

不過當設定 `sampleCount = 2048` 時就變得好多了：

![C# 設定 sampleCount = 2048 的輸出](./assets/output-CSharp-sampleCount-2048.png)

不過設定 `sampleCount = 2048` 時渲染將執行相當長時間，所以之後的所有結果都是將其設定為 `2` 時執行得到的，這也意味著測試執行將在約 1 分鐘內完成。改變 `sampleCount` 僅會影響程式碼最外層迴圈的疊代次數，可以參考此要點來獲取相關解釋。

### 「原生」逐行移植後的結果

為了能夠對 C++ 與 C# 版本作出有意義的對比，我使用了 time-windows 工具，這是 Unix `time` 命令的移植。我最初的結果看起來是這樣：

|                     | C++ (VS 2017) | .NET Framework (4.7.2) | .NET Core (2.2) |
| ------------------- | ------------- | ---------------------- | --------------- |
| Elapsed time (secs) | 47.40         | 80.14                  | 78.02           |
| Kernel time         | 0.14 (0.3%)   | 0.72 (0.9%)            | 0.63 (0.8%)     |
| User time           | 43.86 (92.5%) | 73.06 (91.2%)          | 70.66 (90.6%)   |
| page fault #        | 1,143         | 4,818                  | 5,945           |
| Working set (KB)    | 4,232         | 13,624                 | 17,052          |
| Paged pool (KB)     | 95            | 172                    | 154             |
| Non-paged pool      | 7             | 14                     | 16              |
| Page file size (KB) | 1,460         | 10,936                 | 11,024          |

起初，我們發現 C# 程式碼比起 C++ 版本而言慢了很多，但它確實變得更好了（參看下文）。

無論如何，即便已經使用了「原生」逐行移植，但讓我們先看看 .NET JIT 為我們做了甚麼。首先，它在內嵌較小的「輔助方法」上做得很好，我們可以透過查看優秀的內嵌分析工具的輸出看到這一點（綠色覆蓋的=內嵌的）：

![QueryDatabase 的內嵌分析工具](./assets/Inlining-Analyzer-QueryDatabase.png)

不過不是所有方法都內嵌了，比如 `QueryDatabase(..)` 就因為過於複雜而跳過了：

![](./assets/Inlining-Analyzer-RayMarching-with-ToolTip.png)

