# SpecGate Workspace: website hoạt động như thế nào

## Website này để làm gì?

Khi một nhóm cùng lên ý tưởng, mỗi người thường hỏi một agent AI riêng: người dùng Claude, người dùng DeepSeek, người dùng ChatGPT. Mỗi người một phiên chat, và các phiên này không thấy nhau. Agent của người này không biết người kia đã bàn gì, đã gạt bỏ ý nào. Vì vậy agent hay đề xuất lại những ý nhóm đã loại, hoặc trả lời lạc khỏi hướng nhóm đang đi.

Để agent hiểu được, mọi người phải tự copy và dán qua lại. Ví dụ Lan lo phần dựng khung và dùng Claude, Long làm runner và dùng DeepSeek. Claude của Lan viết "hãy hỏi runner những câu này". Lan copy sang chat nhóm, Long copy vào DeepSeek, lọc câu trả lời rồi dán lại vào chat nhóm, Lan lại copy vào Claude. Mỗi vòng hỏi đáp mất bốn lần copy và dán, và agent không biết câu nào do ai nói.

SpecGate bỏ vòng copy và dán đó bằng ba ý chính:

- Trong workspace riêng, bạn highlight những đoạn đáng giá trong câu trả lời của agent, lưu lại và xem lại. Khi đã chắc, bạn gửi highlight đó vào kênh chat của nhóm, ghi rõ đó là lời của agent nào. Không có chuyện vừa đọc xong là gửi luôn.
- Agent của mỗi người tự đọc được mọi tin mà chủ của nó đã nhắn trong kênh nhóm.
- Tin của người khác chỉ đến được agent của mình khi mình đánh dấu (highlight) đoạn đó, và luôn kèm tên người đã nói. Như vậy, thứ agent đọc là những gì con người đã chọn lọc, không phải toàn bộ đoạn chat.

## Hai không gian trong website

**Workspace riêng.** Mỗi người có đúng một workspace riêng, có sẵn ngay khi tạo tài khoản. Đây là nơi bạn chat với agent của mình, giống như chat trên trang của Claude hay ChatGPT. Chỉ mình bạn thấy những gì trong đó. Workspace riêng không có kênh nhóm, không có bảng ý tưởng, không có thành viên khác.

**Workspace chung.** Đây là nơi cả nhóm làm việc với nhau. Một workspace chung có một đề bài, các kênh chat, một bảng ý tưởng và một bản tổng hợp. Người tạo là chủ workspace; những người khác xin vào và được chủ duyệt thì trở thành thành viên. Workspace chung không có agent của riêng nó. Mỗi thành viên tự mang agent của mình vào.

Một người được tham gia nhiều workspace chung cùng lúc. Họ có thể là chủ ở workspace này và là thành viên ở workspace khác.

## Agent riêng làm được gì?

Mỗi người có đúng một agent riêng. Agent riêng là mô hình AI mà bạn chọn sau khi nhập API key của mình. Agent bạn chat cùng trong workspace riêng và agent có tên trong kênh nhóm là cùng một agent.

Agent nhận chữ và trả lời bằng chữ. Nó làm tốt những việc cần suy nghĩ và viết: phân tích một ý, phản biện, đề xuất hướng làm, tóm tắt, viết khung bài, viết code hay tài liệu.

Agent không tự tìm kiếm trên mạng, không đọc tệp hay ảnh, không chạy code. Những tính năng đó chỉ có trên ứng dụng riêng của từng nhà cung cấp, không có khi gọi agent bằng API key.

Agent cũng không tự làm gì trong nhóm. Nó không tự gửi tin, không tự chốt ý, không tự trả lời trong kênh. Mọi việc đó do con người quyết định.

## Hai loại highlight

Website có hai loại highlight, dùng ở hai nơi khác nhau và cho hai mục đích khác nhau.

**Highlight riêng** nằm trong workspace riêng. Bạn bôi đen một đoạn trong hội thoại với agent của mình, chọn một màu, và lưu lại. Đây là cách bạn giữ lại những ý đáng giá để xem lại sau, rồi khi đã chắc thì gửi vào nhóm. Chi tiết ở mục 4 và mục 6.

**Highlight cho agent** nằm trong kênh của workspace chung. Bạn bôi đen một hoặc nhiều đoạn, trong một tin hay qua nhiều tin của người khác, để agent của mình đọc được những đoạn đó. Chi tiết ở mục 10.

Cả hai loại chỉ người tạo nhìn thấy, và đều lưu nguyên văn đoạn chữ tại lúc chọn.

---

## 1. Tạo tài khoản và đăng nhập

Muốn dùng SpecGate thì bắt buộc phải có tài khoản. Không có chế độ khách. Không có đường dẫn nào cho người lạ vào thẳng một workspace.

Tài khoản chỉ được tạo bằng Google hoặc GitHub, không có mật khẩu riêng. Trang đăng nhập chỉ có một nút cho mỗi cách: "Tiếp tục với Google" và "Tiếp tục với GitHub".

- Nếu đây là lần đầu bạn dùng tài khoản Google hoặc GitHub đó, hệ thống tạo tài khoản SpecGate cho bạn, kèm workspace riêng. Sau đó hệ thống đưa bạn tới màn nhập API key, kèm lời chào.
- Nếu bạn đã có tài khoản, hệ thống đăng nhập luôn và đưa bạn tới Trang chủ (mục 2). Mỗi tài khoản Google hoặc GitHub chỉ ứng với một tài khoản SpecGate, không bao giờ tạo trùng.

Đăng nhập xong, hệ thống không tự đưa bạn vào một workspace chung nào. Ngoại lệ duy nhất: nếu bạn bấm vào một đường dẫn cụ thể khi chưa đăng nhập, ví dụ đường dẫn tới một kênh mà bạn bè gửi, thì đăng nhập xong bạn được đưa tới đúng trang đó.

Nếu bạn bấm hủy ở trang của Google hoặc GitHub, bạn quay về trang đăng nhập và hệ thống không tạo gì.

Hệ thống nhớ đăng nhập trên trình duyệt trong 30 ngày, giống như Messenger. Mỗi lần bạn quay lại, thời gian này được tính lại từ đầu. Bạn đăng xuất được bất cứ lúc nào từ khung thông tin người dùng.

## 2. Trang chủ

Trang chủ là nơi bạn đến sau khi đăng nhập, và là nơi bạn quay về khi bấm logo SpecGate ở bất kỳ đâu. Bạn tự chọn nơi muốn vào, thay vì bị đưa thẳng vào một nhóm.

Trang chủ được giữ thật gọn. Nó không phải một trang thống kê, và không gom mọi chức năng vào một chỗ, vì như vậy vừa rối mắt vừa không hợp lý với cách website được tổ chức.

Trang chủ chỉ gồm:

- Thanh bên trái như mọi trang khác. Thanh này vẫn liệt kê workspace riêng và các workspace chung bạn đang tham gia, kèm các nút tạo workspace, nhập mã tham gia và Khám phá. Đây là chỗ để đi tới các workspace, nên Trang chủ không cần lặp lại danh sách đó.
- Ở giữa là một hình minh họa dễ thương, phong cách hoạt hình, có một chú robot nhỏ, kèm một câu chào ngắn.
- Bên dưới hình là vài lựa chọn để đi vào chức năng chính, ví dụ "Chat với agent của tôi" (mở workspace riêng) và "Vào làm việc với nhóm" (mở một workspace chung). Số lựa chọn ít, mỗi lựa chọn là một nút rõ ràng.

Trang chủ không hiện thống kê, số tin mới, danh sách hội thoại hay danh sách ý tưởng. Những thứ đó nằm ở đúng trang của chúng.

## 3. Nhập API key để có agent riêng

Để chat với agent, bạn cần nhập API key của một nhà cung cấp AI. Mọi lần agent của bạn trả lời đều chạy bằng key của bạn, và chi phí tính vào key đó.

1. Bạn chọn nhà cung cấp: Anthropic (Claude), hoặc một dịch vụ theo kiểu OpenAI như OpenAI, DeepSeek, OpenRouter, Groq, Ollama. Với loại thứ hai, bạn nhập thêm địa chỉ của dịch vụ.
2. Bạn dán key. Hệ thống kiểm tra key ngay với nhà cung cấp.
3. Nếu key dùng được, hệ thống hiện danh sách mô hình của key đó. Bạn chọn một mô hình. Mô hình này chính là agent riêng của bạn.
4. Sau này bạn đổi mô hình, thay key khác, hoặc xóa key ở cùng màn hình này.

Nếu key sai, key đã hết tiền, hoặc không kết nối được tới nhà cung cấp, hệ thống báo lỗi bằng một câu tiếng Việt dễ hiểu và không lưu key.

Key được cất giữ an toàn. Sau khi lưu, bạn chỉ thấy 4 ký tự cuối của key, và không ai xem lại được key đầy đủ, kể cả chính bạn. Không thành viên nào thấy key của người khác.

Gói thuê bao như ChatGPT Plus hay Claude Pro không phải là API key và không dùng được ở đây. Màn nhập key ghi rõ điều này. API key được tạo ở trang dành cho nhà phát triển của mỗi nhà cung cấp, và tính tiền riêng.

## 4. Chat với agent trong workspace riêng

Trang chat trong workspace riêng hoạt động giống trang chat của Claude hay ChatGPT.

Bên trái là danh sách các hội thoại của bạn, hội thoại mới nhất ở trên cùng. Mỗi hội thoại có tên và thời gian cập nhật. Tên tự lấy từ câu hỏi đầu tiên, và bạn đổi được tên. Bạn tạo hội thoại mới, mở lại hội thoại cũ, hoặc xóa hội thoại.

Khi bạn gửi một câu hỏi:

1. Câu hỏi hiện ngay trên màn hình, và câu hỏi được lưu lại trước khi agent bắt đầu trả lời.
2. Câu trả lời hiện dần từng chữ, bạn không phải chờ agent viết xong mới thấy.
3. Câu trả lời hiển thị có định dạng: chữ đậm, tiêu đề, danh sách, bảng và khối code đều hiện đúng như trên trang của các nhà cung cấp.
4. Trong lúc agent đang trả lời, bạn bấm "Dừng" được nếu agent trả lời lạc hướng hoặc quá dài. Phần đã viết vẫn được giữ lại.
5. Dưới mỗi câu trả lời có nút "Chép" để chép câu trả lời, và nút "Tạo lại" để agent trả lời lại câu đó. Mỗi khối code có nút chép riêng.

Agent nhớ những gì đã nói trong cùng một hội thoại. Mỗi lần bạn hỏi, hệ thống gửi lại cho agent các lượt hỏi đáp trước đó, vì agent tự nó không giữ trí nhớ giữa hai lần hỏi. Khi hội thoại quá dài, hệ thống chỉ gửi những lượt gần nhất, để không tốn quá nhiều tiền và không vượt sức chứa của mô hình.

Nếu nhà cung cấp gặp lỗi giữa chừng, ví dụ key hết tiền hoặc mất mạng, câu hỏi của bạn vẫn còn. Câu báo lỗi hiện ngay trong hội thoại thay cho câu trả lời, và lượt lỗi đó không được gửi lại cho agent ở các lần hỏi sau.

Lịch sử chat được lưu lại hết, mở lại hôm sau vẫn còn. Khi bạn xóa một hội thoại, toàn bộ nội dung của nó bị xóa. Những gì bạn đã gửi vào kênh nhóm thì vẫn còn, vì đó là những bản chép riêng. Với các highlight riêng của hội thoại đó, hệ thống hỏi bạn giữ hay xóa (xem phần "Khi nào highlight riêng bị xóa" bên dưới).

### Highlight riêng trong hội thoại

Trong lúc đọc câu trả lời của agent, bạn đánh dấu ngay những đoạn đáng giữ:

1. Bạn bôi đen một đoạn trong câu trả lời của agent. Bạn cũng bôi đen được một đoạn trong câu hỏi của chính mình, nếu đó là một ý bạn muốn giữ.
2. Một thanh nhỏ hiện ra cạnh đoạn đã chọn. Bạn chọn một màu cho highlight trong vài màu có sẵn, ví dụ vàng, xanh lá, xanh dương, hồng, tím. Màu do bạn tự đặt nghĩa, ví dụ vàng là "ý hay", hồng là "cần hỏi lại nhóm". Hệ thống không gán nghĩa cố định cho màu nào.
3. Nếu muốn, bạn ghi thêm một dòng ghi chú ngắn cho highlight.
4. Đoạn đó được tô màu ngay trong hội thoại, và được lưu vào danh sách **Highlight riêng** của bạn.

Danh sách Highlight riêng nằm trong workspace riêng. Trong danh sách này, bạn:

- xem lại mọi highlight, xếp theo thời gian, và lọc theo màu hoặc theo hội thoại;
- bấm vào một highlight để mở lại đúng hội thoại và đúng chỗ đã đánh dấu;
- sửa nội dung, đổi màu, sửa ghi chú, hoặc xóa highlight;
- thấy highlight nào đã được gửi vào nhóm, gửi vào kênh nào và lúc nào.

Highlight riêng chỉ mình bạn thấy. Nó không tự đi đâu cả: không tự vào kênh nhóm, không tự vào ngữ cảnh của agent. Nó chỉ rời workspace riêng khi bạn chủ động gửi (mục 6). Màu bạn chọn chỉ để bạn tự phân loại, không được gửi theo khi vào nhóm.

Highlight riêng không được gửi cho agent, nên không làm tốn tiền key của bạn.

### Khi nào highlight riêng bị xóa

Highlight riêng chỉ bị xóa khi chính bạn quyết định xóa. Hệ thống không bao giờ tự xóa.

**Khi đổi key hoặc đổi mô hình,** mọi highlight riêng được giữ nguyên. Đổi từ Claude sang DeepSeek không làm những ý bạn đã lọc mất giá trị. Mỗi highlight ghi tên mô hình tại lúc tạo, ví dụ "Claude của Lan nói", nên sau khi đổi mô hình bạn vẫn biết đoạn đó là lời của ai.

**Khi xóa hoặc làm lại một hội thoại,** hệ thống hỏi, ví dụ: "Hội thoại này có 5 highlight. Giữ lại hay xóa luôn?". Lựa chọn mặc định là giữ lại, vì người dùng thường xóa một hội thoại dài, rối sau khi đã lọc xong phần đáng giữ, và highlight sinh ra chính để giữ phần đó. Nếu giữ lại, các highlight ghi thêm "hội thoại gốc đã bị xóa", và không còn mở lại được đúng chỗ trong hội thoại.

**Để danh sách không phình quá to,** mỗi người giữ được tối đa khoảng 200 highlight riêng. Khi gần đủ, hệ thống nhắc bạn dọn bớt. Danh sách có nút "Dọn dẹp" để xóa nhiều highlight cùng lúc theo màu, theo hội thoại, hoặc chỉ những highlight đã gửi vào nhóm.

Xóa một highlight riêng không làm mất các thẻ trích dẫn đã gửi từ highlight đó vào kênh, vì thẻ trong kênh là bản chụp riêng.

Không ai khác mở được hội thoại của bạn. Kể cả khi ai đó cố đoán đường dẫn của hội thoại, hệ thống cũng chỉ báo "không tìm thấy", để người đó không biết hội thoại có tồn tại hay không.

## 5. Đưa ngữ cảnh nhóm vào hội thoại riêng

Mọi hội thoại đều nằm trong workspace riêng của bạn. Mỗi hội thoại có thêm một ô gọi là **Ngữ cảnh nhóm**.

- Nếu ô này để "Không có", bạn chat với agent như bình thường, giống trên trang của nhà cung cấp.
- Nếu ô này chọn một workspace chung mà bạn là thành viên, agent sẽ biết nhóm đó đang bàn gì.

Bạn chọn ô Ngữ cảnh nhóm khi tạo hội thoại mới, hoặc đổi bất cứ lúc nào sau đó. Dù bạn tham gia nhiều workspace chung, mỗi hội thoại chỉ lấy ngữ cảnh từ một workspace tại một thời điểm, để agent không bị trộn chuyện của hai nhóm. Trong danh sách hội thoại, hội thoại có ngữ cảnh nhóm có biểu tượng riêng để dễ nhận ra.

Khi đã chọn một workspace chung, mỗi câu hỏi của bạn được gửi kèm những thông tin sau của workspace đó:

- đề bài của nhóm;
- danh sách thành viên: tên trong workspace, ai là chủ, vai của từng người trong nhóm, và mỗi người đang dùng agent nào;
- các ý nhóm đã chốt, kèm lý do;
- các ý nhóm đã loại, kèm lý do, và lời dặn agent đừng đề xuất lại;
- mọi tin bạn đã nhắn trong các kênh của workspace đó, kể cả các thẻ trích dẫn và bản tóm tắt hội thoại bạn đã gửi;
- các đoạn bạn đã highlight từ tin của người khác, kèm tên người nói, nhãn bạn gắn, ghi chú của bạn nếu có, và lời nhắc rằng đó chưa phải là quyết định của nhóm;

Ngoài các đoạn bạn đã highlight, agent không đọc tin nào khác của người khác. Việc ai đó nhắc tên bạn trong kênh cũng không làm tin đó lọt vào agent của bạn.

**Tin của bạn và các đoạn highlight được xếp chung một dòng thời gian.** Hai loại này không bị tách thành hai khối riêng. Mỗi mục ghi giờ, kênh và người nói. Nếu mục đó là tin trả lời một tin khác thì ghi thêm đang trả lời tin của ai. Nhờ vậy, khi Khang viết "Agent của Ngọc nói không hợp lý ở điểm…", agent của bạn biết Khang nói câu đó trước hay sau câu của bạn, và đang phản biện câu nào.

**Bản tóm tắt kênh ("/summarize") không tính là tin của bạn.** Bản tóm tắt hiện trong kênh dưới tên agent của chủ workspace, nhưng nội dung là ý của mọi người và chưa ai lọc. Vì vậy, kể cả khi bạn là chủ, bản tóm tắt không tự vào ngữ cảnh agent của bạn. Muốn agent đọc phần nào trong đó, bạn highlight phần đó như với tin của người khác (mục 10).

Agent được dặn phải nói rõ mình dựa vào ý của ai khi trả lời. Nhờ vậy agent có thể nói kiểu "Long nói như vậy là chưa chính xác, vì…".

Thông tin nhóm được lấy mới ở mỗi câu hỏi. Nếu ai đó vừa chốt một ý, hoặc bạn vừa highlight thêm một đoạn, câu hỏi tiếp theo của bạn đã có ngay thông tin đó.

Việc thêm ngữ cảnh nhóm không giúp tiết kiệm. Ngược lại, mỗi câu hỏi dài hơn vì phải gửi kèm thông tin của nhóm. Đổi lại, agent hiểu nhóm đang đi theo hướng nào, không đề xuất lại ý đã bị loại, và không trả lời lạc đề. Để thông tin nhóm không phình quá to, hệ thống gửi nguyên văn khoảng 50 tin gần nhất của bạn, và mỗi người chỉ giữ được tối đa khoảng 30 highlight trong mỗi workspace (mục 10).

**Khi tin của bạn vượt giới hạn,** phần tin cũ hơn không bị bỏ trắng. Agent của bạn, chạy bằng key của bạn, tóm tắt chúng thành một khối "Tóm tắt tin cũ của tôi", và khối này được gửi kèm thay cho các tin cũ. Khối tóm tắt ở lại workspace riêng và hiện trong khung "Agent đang đọc". Con người quyết định có đưa nó vào nhóm hay không: muốn chia sẻ thì bạn lưu nó vào danh sách Highlight riêng rồi gửi như mọi highlight khác (mục 6). Agent không tự đưa gì vào workspace chung. Highlight thì không bao giờ bị cắt hay bị tóm tắt.

Bên phải hội thoại có một khung tên là **"Agent đang đọc"**. Khung này cho bạn thấy chính xác những gì agent sẽ nhận được về nhóm. Trong khung này, bạn sửa được vai của mình trong nhóm, và bỏ được những đoạn highlight không còn cần.

Nếu bạn không còn là thành viên của workspace đó, hội thoại vẫn còn, nhưng agent không nhận thông tin của nhóm nữa.

### Ngữ cảnh đi theo hai chiều

Ngữ cảnh giữa workspace riêng và workspace chung đi theo hai chiều, mỗi chiều một cơ chế:

- **Chung sang riêng: tự động, chỉ để đọc.** Mỗi câu hỏi trong hội thoại đã chọn ngữ cảnh nhóm được gửi kèm thông tin nhóm như mô tả ở trên. Chỉ agent của bạn đọc phần này, không ai khác thấy.
- **Riêng sang chung: thủ công.** Chỉ những gì bạn chủ động gửi mới rời workspace riêng (mục 6). Hội thoại riêng không bao giờ tự sang kênh, agent không tự đăng tin, và không ai mở được hội thoại riêng của bạn.

Hai chiều nối với nhau thành một vòng. Claude của Lan trả lời trong hội thoại riêng, Lan gửi một đoạn vào kênh. Đoạn đó là tin của Lan, nên tự quay lại ngữ cảnh của Lan, kể cả ở các hội thoại riêng khác cùng chọn workspace đó. Long highlight đoạn đó, nên DeepSeek của Long đọc được, kèm nhãn "Claude của Lan nói". Long gửi câu trả lời của DeepSeek vào kênh, Lan highlight, và vòng lặp tiếp tục mà không ai phải copy hay dán.

Hai hội thoại riêng của cùng một người không thấy nhau. Chúng chỉ nối với nhau qua những gì đã được gửi vào kênh.

## 6. Đưa kết quả từ workspace riêng vào kênh nhóm

Đây là tính năng thay cho việc copy và dán. Nguyên tắc chung là **lưu lại, xem lại, rồi mới gửi**: không có nút nào đưa câu trả lời của agent thẳng vào kênh ngay khi vừa đọc xong. Mọi thứ đi vào nhóm đều phải đi qua danh sách Highlight riêng trước. Agent không tự gửi gì vào kênh.

Có hai thứ bạn đưa được vào nhóm: một highlight riêng (ý bạn đã lọc), hoặc một bản tóm tắt hội thoại (khi bạn chưa lọc được ý).

### Cách thứ nhất: gửi highlight riêng

Dùng khi bạn đã đánh dấu được ý đáng đưa cho nhóm (mục 4).

Bước chuẩn bị luôn giống nhau: bạn highlight trong hội thoại, highlight được lưu vào danh sách Highlight riêng, và bạn xem lại nó khi cần. Khi đã chắc, bạn gửi theo một trong hai đường.

**Đường thứ nhất: gửi từ danh sách Highlight riêng.**

1. Trong danh sách Highlight riêng, bạn chọn một hoặc vài highlight rồi bấm "Gửi vào nhóm".
2. Một hộp thoại mở ra. Bạn chọn workspace chung và kênh muốn gửi, xem lại nội dung lần cuối, sửa nếu cần, và thấy rõ đoạn đó sẽ hiện là lời của ai, ví dụ "Claude của Lan", hoặc "Claude của Lan (Lan đã chỉnh)" nếu bạn đã sửa chữ.
3. Bạn bấm gửi. Đoạn đó hiện trong kênh dưới dạng một thẻ trích dẫn, ghi rõ người nói.

**Đường thứ hai: gọi highlight bằng phím tắt @ ngay trong kênh.**

1. Đang soạn tin trong kênh của workspace chung, bạn gõ dấu @.
2. Danh sách gợi ý có thêm một mục **"Highlight của tôi"**, bên cạnh tên các thành viên. Bạn chọn mục đó, rồi chọn một highlight trong danh sách Highlight riêng của mình. Bạn lọc được theo màu hoặc gõ vài chữ để tìm.
3. Highlight được chèn vào tin đang soạn thành một thẻ trích dẫn. Bạn viết thêm lời của mình xung quanh, ví dụ "Mọi người xem đoạn này, mình thấy hợp với hướng của Long", rồi gửi.
4. Tin hiện trong kênh dưới tên bạn, kèm thẻ trích dẫn ghi rõ lời trong thẻ là của ai, ví dụ "Claude của Lan nói".

Đường thứ hai giúp bạn không phải rời kênh để tìm lại ý đã lưu: đang bàn tới đâu, gọi đúng highlight đó ra tới đó.

Thẻ trích dẫn trong kênh luôn ghi người nói của đoạn gốc: nếu đoạn đó là câu trả lời của agent thì ghi "Claude của Lan", nếu là câu bạn tự viết thì ghi tên bạn. Người khác highlight được đoạn trong thẻ để kéo vào agent của họ (mục 10), và người nói được giữ đúng như trong thẻ.

**Đoạn đã chỉnh được ghi rõ.** Nếu bạn sửa chữ trong lời của agent (không chỉ cắt bớt), dù là sửa trong danh sách Highlight riêng hay lúc gửi, thẻ ghi thêm "(Lan đã chỉnh)", ví dụ "Claude của Lan nói (Lan đã chỉnh)". Cả nhóm lẫn agent của Lan khi đọc lại đều biết đoạn này không hoàn toàn do agent viết, và agent của người khác không quy cho agent những chữ nó chưa từng viết.

### Cách thứ hai: gửi bản tóm tắt hội thoại

Dùng khi bạn đã brainstorm với agent một hồi mà chưa phân định được ý nào đáng giữ, nhưng muốn cả nhóm cùng nhìn vào để lọc.

1. Trong hội thoại, bạn bấm "Tóm tắt cho nhóm". Agent của bạn, chạy bằng key của bạn, viết một bản tóm tắt theo khung cố định: vấn đề đang xét; các hướng đã thử và kết quả; những điểm còn chưa chắc; những câu hỏi muốn nhóm trả lời.
2. Bản tóm tắt không được gửi ngay. Nó được lưu vào danh sách Highlight riêng như một mục đặc biệt, có ghi "bản tóm tắt". Bạn xem lại, sửa hoặc xóa bớt bất cứ lúc nào.
3. Nếu muốn, bạn đính kèm thêm vài lượt hỏi đáp gốc. Bạn tự chọn lượt nào, và số lượt đính kèm có giới hạn.
4. Khi đã chắc, bạn gửi bản tóm tắt vào nhóm theo một trong hai đường ở trên: từ danh sách Highlight riêng, hoặc gọi bằng @ trong kênh.
5. Trong kênh, bản tóm tắt hiện thành một thẻ riêng, nhìn khác với tin thường. Thẻ ghi rõ, ví dụ: "Tóm tắt hội thoại của Lan, do Claude của Lan viết, chưa được lọc". Các lượt hỏi đáp gốc nằm thu gọn trong thẻ, ai muốn xem thì mở ra.
6. Người khác dùng highlight để kéo phần họ thấy đáng giá trong thẻ vào agent của mình, như với mọi tin khác.

Không có cách gửi nguyên văn cả hội thoại. Hội thoại nguyên văn thường dài, nhiều nhiễu, tốn tiền khi agent của người khác đọc, và có thể chứa những thứ bạn không định cho ai xem.

Hai cách khác nhau ở chỗ: cách thứ nhất nghĩa là "mình đã lọc rồi, đây là ý"; cách thứ hai nghĩa là "mình chưa lọc được, nhờ cả nhóm cùng lọc".

### Quy tắc chung của cả hai cách

Mọi thứ gửi vào nhóm đều phải được lưu trong danh sách Highlight riêng trước, và bạn là người bấm gửi. Hội thoại riêng của bạn không đi theo, và không ai mở được nó.

Bạn gửi được highlight riêng vào bất kỳ workspace chung nào bạn đang là thành viên. Hội thoại chứa highlight đó không cần chọn ngữ cảnh nhóm.

Thẻ trong kênh là bản chụp tại lúc gửi. Sau này bạn sửa hoặc xóa highlight trong danh sách Highlight riêng thì thẻ đã gửi trong kênh không thay đổi. Một highlight có thể được gửi nhiều lần, vào nhiều kênh; danh sách ghi lại từng lần gửi, và hệ thống nhắc nếu bạn sắp gửi lại vào đúng kênh đã gửi.

Tin trong kênh giữ tên mô hình tại lúc gửi. Sau này bạn đổi sang mô hình khác thì các tin cũ vẫn giữ tên cũ.

Chỉ chính bạn mới gửi được tin dưới tên agent của bạn.

## 7. Tạo workspace chung

Bạn bấm nút dấu cộng trên thanh bên trái. Bạn nhập tên, nhập đề bài, và chọn chế độ hiển thị: ẩn, hoặc để ai cũng tìm thấy.

Workspace mới có sẵn một kênh tên "chung" và một mã tham gia. Bạn trở thành chủ workspace.

Các ràng buộc khi tạo:

- Tên và đề bài là bắt buộc. Thiếu một trong hai thì hệ thống không cho tạo và chỉ rõ phần còn thiếu.
- Tên workspace không được trùng với một workspace khác do chính bạn làm chủ, để danh sách của bạn không có hai mục giống nhau.
- Mỗi người làm chủ tối đa khoảng 10 workspace chung, để tránh tạo bừa.
- Không bắt buộc phải có API key mới được tạo. Chủ chỉ cần key khi dùng lệnh tóm tắt kênh.

Workspace chung không có agent của riêng nó, và không có agent nào làm "trọng tài" tự động đọc kênh. Workspace hiểu được ngữ cảnh thông qua những thứ nó đã lưu: đề bài, bảng ý tưởng (nhất là các ý đã loại kèm lý do) và bản tổng hợp. Agent của từng thành viên đều đọc những thứ này. Nếu sau này nhóm thấy cần một bước kiểm tra, việc đó sẽ là một lệnh do chủ chủ động gọi, không phải một agent tự chạy (xem phần "Những việc để làm sau").

## 8. Tham gia workspace chung

Muốn vào một workspace chung thì phải được chủ workspace duyệt. Một người được tham gia nhiều workspace chung, không giới hạn. Có hai cách xin vào.

**Cách thứ nhất là dùng mã tham gia.** Mỗi workspace chung có một mã gồm 7 chữ và số. Mã không dùng những ký tự dễ nhìn nhầm như chữ O và số 0. Bất kỳ thành viên nào cũng xem và chép được mã, rồi gửi cho người muốn mời qua tin nhắn, email hay bất cứ cách nào.

Người nhận bấm nút hình chìa khóa ở thanh bên trái rồi nhập mã. Gõ chữ thường hay có dấu cách cũng được. Hệ thống tạo một yêu cầu tham gia và đưa người đó tới trang "Đang chờ duyệt". Trên thanh bên trái, workspace đang chờ hiện mờ. Khi chủ duyệt, trang chờ tự chuyển người đó vào workspace, không cần tải lại trang.

Nếu mã sai, hoặc chủ đã đổi mã, hệ thống báo mã không hợp lệ và gợi ý xin mã mới.

**Cách thứ hai là qua trang Khám phá.** Trang Khám phá liệt kê các workspace chung để chế độ "ai cũng tìm thấy". Bạn tìm theo tên hoặc đề bài. Mỗi workspace cho biết bạn chưa tham gia, đang chờ duyệt, hay đã là thành viên. Bạn gửi yêu cầu tham gia kèm một lời nhắn cho chủ workspace. Workspace để chế độ ẩn không hiện ở trang Khám phá; muốn vào thì phải có mã.

**Chủ workspace duyệt yêu cầu.** Chỉ chủ workspace thấy trang "Yêu cầu tham gia". Trang này tự cập nhật khi có yêu cầu mới. Mỗi yêu cầu cho biết ai xin vào, xin bằng mã hay qua Khám phá, và lời nhắn nếu có. Chủ bấm Duyệt hoặc Từ chối. Người được duyệt trở thành thành viên. Các yêu cầu đã xử lý được giữ lại trong phần lịch sử.

**Tên trong workspace phải là duy nhất.** Khi được duyệt vào, nếu tên hiển thị của người mới trùng với tên của một thành viên đã có, hệ thống yêu cầu người mới đặt một biệt danh riêng cho workspace đó, ví dụ "Lan B" hay "Lan Phạm". Biệt danh này được dùng ở mọi nơi trong workspace (xem mục 13).

Một vài quy tắc khác:

- Mỗi người chỉ có một yêu cầu đang chờ cho mỗi workspace. Xin thêm lần nữa thì yêu cầu cũ được cập nhật.
- Người xin tự hủy được yêu cầu của mình khi đang chờ.
- Chủ workspace đổi được mã tham gia. Mã cũ hết hiệu lực ngay lập tức.
- Nếu bạn mở một workspace mà bạn chưa là thành viên, hệ thống đưa bạn tới trang Khám phá và chọn sẵn workspace đó.

## 9. Kênh chat của nhóm

Kênh chat hoạt động giống các ứng dụng chat nhóm quen thuộc. Tin mới hiện ngay cho mọi người đang mở kênh, không cần tải lại trang. Nếu mạng chập chờn, kênh tự kết nối lại và hiện bù những tin đã lỡ.

Trong kênh có bốn loại tin, nhìn vào là phân biệt được:

- tin của người;
- thẻ trích dẫn từ highlight riêng của một thành viên, ghi rõ người nói của đoạn gốc, ví dụ "DeepSeek của Long nói" (mục 6);
- thẻ tóm tắt hội thoại (mục 6);
- tin của hệ thống, ví dụ thông báo đã thêm một ý lên bảng.

Mỗi thành viên có một ảnh đại diện màu riêng, được hệ thống gán sao cho trong cùng workspace không có hai người trùng màu. Thẻ trích dẫn lời agent mang màu và chữ cái đầu của chủ agent, nên nhìn màu là biết agent của ai. Rê chuột vào tên một người sẽ thấy tài khoản gốc của họ, ví dụ tên GitHub hoặc email đã che bớt.

Khi soạn tin, gõ dấu @ thì hệ thống gợi ý tên các thành viên, cùng mục "Highlight của tôi" để chèn một highlight riêng vào tin (mục 6). Gõ dấu gạch chéo thì hệ thống gợi ý các lệnh. Bạn chọn gợi ý bằng chuột hoặc bàn phím.

Trong kênh không có agent nào tự trả lời. Nhắc tên một người hay một agent cũng không làm agent nào lên tiếng. Lời của agent chỉ xuất hiện trong kênh khi chủ của nó gửi một highlight riêng hoặc một bản tóm tắt từ workspace riêng.

Cột bên cạnh kênh liệt kê agent của từng thành viên, để cả nhóm biết ai đang dùng mô hình nào.

Các lệnh dùng được trong kênh:

- "/idea" kèm nội dung: ghi một ý lên bảng ý tưởng.
- "/note" kèm nội dung: thêm một ghi chú.
- "/pin": dùng khi đang trả lời một tin, để đưa tin đó lên bảng ý tưởng.
- "/decide" kèm số của ý, chữ "chốt" hoặc "loại", và lý do: chốt hoặc loại một ý.
- "/summarize": tóm tắt kênh, chỉ chủ workspace dùng được.
- "/brief": dựng bản tổng hợp, chỉ chủ workspace dùng được.
- "/help": xem danh sách lệnh.

Lệnh chỉ có tác dụng khi do người gõ. Nếu một tin của agent có chứa lệnh, lệnh đó không được thực hiện. Nhờ vậy agent không thể tự chốt hay tự loại ý.

## 10. Highlight cho agent: đưa ý của người khác vào agent của mình

Đây là loại highlight thứ hai, dùng trong kênh của workspace chung, khác với highlight riêng ở workspace riêng (mục 4). Nó cho phép bạn chọn lọc những gì của người khác mà agent của bạn cần đọc.

1. Trong kênh nhóm, bạn bôi đen một hoặc nhiều đoạn trong tin của người khác, hoặc trong thẻ trích dẫn hay thẻ tóm tắt hội thoại của người khác. Vùng chọn có thể nằm trong một tin, hoặc trải qua nhiều tin liền nhau, ví dụ khi Khang nhắn hai tin nối tiếp cho cùng một ý.
2. Bạn bấm "Highlight cho agent của tôi" và chọn một nhãn: "Quan trọng" hoặc "Cần xem xét".
3. Hộp thoại hiện từng đoạn bạn đã chọn, mỗi đoạn kèm tên người nói, ví dụ "Long" hoặc "DeepSeek của Long". Bạn chỉ được thu hẹp hoặc bỏ bớt đoạn, **không được sửa chữ**, để câu ghi "Khang nói" đúng là chữ của Khang. Muốn thêm ý của mình thì ghi vào ô "Ghi chú của tôi", ô này tách riêng khỏi lời người nói.
4. Bạn bấm lưu.

Sau khi lưu, đoạn đó:

- hiện trong danh sách "Highlight cho agent", được xếp theo từng workspace;
- được tô một vệt phấn vàng nhạt trong kênh, nhưng chỉ bạn nhìn thấy vệt phấn này;
- được gửi kèm cho agent của bạn trong mọi hội thoại có chọn workspace này làm ngữ cảnh nhóm.

Bạn bỏ một highlight ở danh sách "Highlight cho agent", hoặc ngay trong khung "Agent đang đọc".

Một vài quy tắc của highlight:

- Bạn không highlight được tin của chính mình, kể cả thẻ trích dẫn lời agent của mình mà bạn đã gửi, vì agent đã tự đọc những tin đó. Khi bạn bôi đen những tin này, hệ thống nhắc bạn điều đó. Nếu vùng chọn trải qua nhiều tin và có lẫn tin của bạn, phần đó được bỏ ra kèm lời nhắc "đã tự vào ngữ cảnh", các phần còn lại vẫn được lưu.
- Một highlight gồm nhiều đoạn vẫn giữ người nói và tin gốc riêng cho từng đoạn. Agent không gộp lời của hai người thành một.
- Bạn không sửa được chữ của người khác trong highlight, cả lúc lưu lẫn sau này. Bạn chỉ sửa được ghi chú của mình và nhãn.
- Highlight chỉ là đánh dấu cho agent của bạn. Nó chưa phải là quyết định của nhóm, và không tự lên bảng ý tưởng.
- Highlight của ai chỉ người đó thấy. Người khác không biết bạn đã highlight gì.
- Highlight lưu lại nguyên văn đoạn chữ lúc bạn chọn. Nếu sau này hội thoại gốc bị xóa, highlight vẫn còn.
- Mỗi người giữ được tối đa khoảng 30 highlight trong mỗi workspace. Khi đã đủ, hệ thống không tự xóa highlight cũ, vì như vậy bạn sẽ không biết agent đã mất thông tin gì. Thay vào đó, hệ thống nhắc bạn tự bỏ bớt trước khi thêm highlight mới. Highlight do con người chọn, nên con người cũng là người quyết định bỏ.

## 11. Bảng ý tưởng

Mỗi workspace chung có một bảng ý tưởng gồm bốn cột: Đề xuất, Đang bàn, Đã chốt và Đã loại. Trạng thái của một ý được nhận biết qua cột chứa nó và chữ ghi trên thẻ, không dùng màu.

**Đưa ý lên bảng.** Mọi thành viên đều đưa ý lên được, theo ba cách:

- gõ "/idea" kèm nội dung ngay trong kênh;
- trả lời một tin trong kênh rồi gõ "/pin" để đưa tin đó lên bảng, kể cả tin của agent; thẻ lấy từ tin của agent sẽ ghi là agent của ai;
- bấm nút thêm ngay trên trang Bảng ý tưởng.

Ý mới luôn nằm ở cột Đề xuất. Bảng còn có một mục ghi chú riêng, thêm bằng lệnh "/note".

Mỗi thẻ ghi số thứ tự, ai đưa lên (người, hay agent của ai), lúc nào, và ý đó đến từ tin nào trong kênh nào.

**Đưa vào bàn.** Chỉ chủ workspace chuyển một ý từ cột Đề xuất sang cột Đang bàn. Đây là trách nhiệm của chủ: chủ là người quyết định nhóm sẽ dành thời gian bàn những ý nào.

**Chốt hoặc loại.** Khi nhóm đã quyết, bấm Chốt hoặc Loại trên thẻ, hoặc gõ lệnh "/decide" trong kênh. Lý do là bắt buộc: không có lý do thì không chốt hay loại được. Bảng ghi lại ai đã quyết định và lúc nào. (Ai được chốt và loại, chủ hay mọi thành viên, là một điểm còn cần quyết định.)

Ý đã chốt hoặc đã loại thì không quay lại được. Cột Đã loại luôn được giữ trên bảng, để cả nhóm và agent của mọi người nhớ những gì đã bị gạt bỏ và vì sao.

Chỉ con người mới chốt hay loại được ý. Agent không làm được việc này.

## 12. Tóm tắt và bản tổng hợp

Đây là quyền riêng của chủ workspace.

**Tóm tắt kênh.** Chủ workspace gõ "/summarize" trong kênh. Agent của chủ đọc các tin gần đây của kênh và viết một bản tóm tắt: các ý chính, ai đề xuất gì, những điểm còn đang tranh luận. Bản tóm tắt hiện trong kênh dưới tên agent của chủ, và được tính tiền vào key của chủ. Agent được dặn không tự chốt hay loại ý nào. Vì bản tóm tắt chứa ý của mọi người chưa qua lọc, nó không tự vào ngữ cảnh agent của chủ như các tin khác của chủ; ai muốn agent của mình đọc phần nào thì highlight phần đó (mục 5 và mục 10). Nếu chủ chưa nhập API key, hệ thống nhắc chủ nhập key trước.

**Bản tổng hợp.** Chủ workspace gõ "/brief" trong kênh, hoặc bấm nút trên trang Tổng hợp. Hệ thống dựng một bản tổng hợp từ bảng ý tưởng, gồm các ý đã chốt, các ý đã loại kèm lý do, và các ý còn đang bàn. Mọi thành viên đều xem được bản tổng hợp mới nhất và tải nó về dạng tệp Markdown.

Nếu một thành viên không phải chủ dùng hai lệnh này, hệ thống trả lời rằng đây là quyền của chủ workspace.

## 13. Thành viên và cài đặt workspace

Mọi thành viên xem được danh sách thành viên của workspace. Với mỗi người, danh sách cho biết tên trong workspace, ảnh đại diện màu, người đó là chủ hay thành viên, vai của họ trong nhóm, và họ đang dùng agent nào. Nếu ai chưa nhập key, danh sách ghi "chưa nhập key". Không ai thấy key của người khác.

**Tên trong workspace** là duy nhất trong mỗi workspace. Mặc định đó là tên hiển thị của tài khoản. Nếu trùng với người đã có, người mới đặt một biệt danh riêng cho workspace đó. Tên này dùng ở mọi nơi trong workspace: kênh, tên agent ("Claude của Lan B"), người nói trong highlight, và ngữ cảnh gửi cho agent. Nhờ vậy, kể cả hai người cùng tên, cùng vai và cùng dùng một mô hình, cả nhóm lẫn agent vẫn không nhầm người này với người kia.

**Vai trong nhóm** là một dòng ngắn, tối đa 40 ký tự, mỗi người tự ghi về việc mình làm, ví dụ "Dựng khung" hay "Runner". Agent của mọi thành viên đều đọc được vai này, nên biết trong nhóm còn ai và ai đang làm gì. Mỗi người chỉ sửa được vai của chính mình.

Chủ workspace có thêm các quyền: sửa đề bài, đổi tên và chế độ hiển thị của workspace, tạo kênh mới, đổi mã tham gia, và chuyển ý từ Đề xuất sang Đang bàn.

## 14. Kết nối mạng

SpecGate là website chạy trên máy chủ, nên cần kết nối Internet mới dùng được. Wifi, mạng dây hay 4G đều được, miễn là có Internet. Có ba lý do:

- Dữ liệu của mọi người (tài khoản, hội thoại, kênh, bảng ý tưởng) nằm trên máy chủ, không nằm trên máy của từng người.
- Đăng nhập đi qua Google hoặc GitHub, nên phải kết nối được tới họ.
- Agent chạy ở máy chủ của nhà cung cấp AI (Anthropic, DeepSeek, OpenAI…). Mỗi câu trả lời đều cần máy chủ SpecGate kết nối được tới nhà cung cấp.

Website không có chế độ ngoại tuyến. Khi mất mạng, website xử lý như sau để người dùng không mất công sức:

- Trên cùng màn hình hiện một dải báo "Mất kết nối, đang thử kết nối lại". Nút gửi tạm khóa, để người dùng không tưởng tin đã đi.
- Chữ đang soạn dở trong ô nhập (câu hỏi cho agent, hoặc tin trong kênh) được giữ lại trên trình duyệt, không bị xóa.
- Website tự kết nối lại khi có mạng. Kênh chat tự hiện bù những tin đã lỡ trong lúc mất mạng.
- Nếu mất mạng khi agent đang trả lời, phần câu trả lời đã viết được giữ lại trong hội thoại. Người dùng bấm "Tạo lại" nếu muốn có câu trả lời đầy đủ.

Có một ngoại lệ dành cho người phát triển: có thể cài cả SpecGate lẫn một mô hình AI chạy trên máy (ví dụ Ollama) trong cùng một mạng nội bộ. Khi đó việc chat với agent không cần Internet. Tuy vậy, đăng nhập bằng Google hoặc GitHub vẫn cần Internet, nên với người dùng bình thường, website vẫn phải có mạng.

---

## Một vòng làm việc mẫu

1. Lan đăng nhập bằng GitHub và vào Trang chủ. Lan nhập API key của Anthropic và chọn Claude.
2. Từ thanh bên trái, Lan tạo workspace "Đồ án Kiểm chứng", viết đề bài, ghi vai của mình là "Dựng khung", rồi gửi mã tham gia cho Long.
3. Long đăng nhập bằng GitHub, nhập API key của DeepSeek, nhập mã ở thanh bên trái và chờ. Lan duyệt. Long ghi vai của mình là "Runner".
4. Long nhắn trong kênh "chung" rằng lần chạy đầu trên máy của Long còn bỏ sót vài trường hợp biên. Lan highlight cho agent tin đó với nhãn "Quan trọng".
5. Lan mở một hội thoại trong workspace riêng, chọn ô Ngữ cảnh nhóm là "Đồ án Kiểm chứng", và hỏi Claude nên làm gì tiếp. Claude đọc được đề bài, vai của từng người và đoạn tin của Long mà Lan vừa highlight, đề xuất một hướng sửa, và gợi ý vài câu cần hỏi runner. Lan highlight màu vàng đoạn đề xuất, và highlight màu hồng đoạn câu hỏi cho runner. Cả hai được lưu vào danh sách Highlight riêng của Lan; chưa có gì vào kênh.
6. Buổi chiều, Lan mở lại danh sách Highlight riêng, lọc màu hồng, và sửa câu hỏi cho gọn. Sang kênh "chung", Lan gõ "Long ơi, nhờ bạn xem giúp", rồi gõ @, chọn "Highlight của tôi" và chọn đoạn câu hỏi vừa sửa. Tin hiện dưới tên Lan, kèm thẻ trích dẫn ghi "Claude của Lan nói".
7. Long highlight cho agent đoạn câu hỏi trong thẻ trích dẫn của Lan. Trong hội thoại riêng của mình, cũng chọn ngữ cảnh nhóm là "Đồ án Kiểm chứng", Long hỏi DeepSeek về hướng sửa mà Claude của Lan đề xuất. Long brainstorm khá lâu mà chưa chốt được hướng nào, nên bấm "Tóm tắt cho nhóm". Bản tóm tắt được lưu vào danh sách Highlight riêng của Long. Long xem lại, bỏ bớt một đoạn, rồi gửi vào kênh từ danh sách đó.
8. Lan highlight cho agent phần đáng chú ý trong bản tóm tắt của Long, rồi hỏi Claude tiếp. Claude trả lời dựa trên những gì runner đã nói.
9. Những ý tốt được đưa lên bảng bằng "/idea" hoặc "/pin". Lan, với vai trò chủ, chuyển các ý đó sang Đang bàn. Nhóm bàn, rồi chốt hoặc loại từng ý kèm lý do. Từ lúc đó, agent của cả Lan và Long đều biết ý nào đã chốt, ý nào đã bị loại.
10. Lan gõ "/brief". Bản tổng hợp có các ý đã chốt, các ý đã loại kèm lý do và các ý còn đang bàn. Cả nhóm tải về.

Trong cả vòng làm việc này, không ai phải copy và dán lần nào.

---

## Những gì website không làm

- Không dùng được gói thuê bao như Claude Pro hay ChatGPT Plus thay cho API key. Lấy thông tin đăng nhập của gói thuê bao, hay viết tiện ích trình duyệt điều khiển trang của nhà cung cấp, đều trái điều khoản của nhà cung cấp. Có một cách hợp lệ là để ứng dụng Claude kết nối sang SpecGate, nhưng cách đó chỉ giúp đỡ tốn tiền, không giải quyết thêm gì cho bài toán, và mỗi người phải tự cài đặt trong từng ứng dụng.
- Agent không tìm kiếm web, không đọc tệp hay ảnh, không chạy code.
- Không tải tệp hay ảnh vào chat.
- Không gửi nguyên văn cả hội thoại riêng vào kênh, và không xuất hội thoại riêng ra tệp. Phần cần chia sẻ thì gửi đoạn đã lọc hoặc bản tóm tắt; phần cần lưu cho nhóm thì đã có bản tổng hợp.
- Không có agent của riêng workspace chung, không có agent trọng tài tự động. Không có agent tự trả lời khi được nhắc tên. Không có agent gọi agent khác.
- Mỗi người chỉ có một key và một agent.
- Không có chế độ dùng khi mất mạng (mục 14).

## Những việc để làm sau

- Cách thứ hai gửi vào kênh: bản tóm tắt hội thoại (mục 6), nếu không đủ thời gian làm trong đợt này.
- Lệnh "/check" do chủ chủ động gọi: agent của chủ đối chiếu các ý mới với bảng ý tưởng và chỉ ra những chỗ đáng chú ý, ví dụ "ý 12 giống ý 4 đã bị loại vì…" hoặc "ý 9 mâu thuẫn với ý 3 đã chốt". Lệnh này không tự chốt, không tự loại, và không tự chạy khi chưa được gọi.
- Mời thành viên qua email hoặc GitHub.
- Dùng gói thuê bao qua kết nối từ ứng dụng của nhà cung cấp, như đã nói ở phần trên.

---

## Những điểm nhóm còn cần quyết định

1. Khi hội thoại riêng quá dài, nên gửi cho agent bao nhiêu lượt gần nhất?
2. Giữ lệnh "/summarize", hay bỏ và chỉ dùng "/brief"?
3. Chủ workspace đã là người chuyển ý sang Đang bàn. Vậy việc chốt và loại có nên cũng chỉ chủ làm, cho trách nhiệm rõ ràng, hay để mọi thành viên làm được miễn là ghi tên và lý do?
4. Khi một người rời workspace, bị chủ xóa khỏi workspace, hoặc khi workspace bị xóa, thì highlight và các hội thoại có ngữ cảnh nhóm của người đó xử lý thế nào?
5. Cách thứ hai gửi vào kênh (bản tóm tắt hội thoại) làm trong đợt này, hay để sau?
6. Các con số giới hạn đang đề xuất (200 highlight riêng mỗi người, 30 highlight cho agent mỗi workspace, 10 workspace làm chủ, và 50 tin của mình trong ngữ cảnh) có hợp lý không?
7. Danh sách màu của highlight riêng gồm những màu nào, và bao nhiêu màu là đủ?
8. Hội thoại mới có tự chọn sẵn ngữ cảnh nhóm (ví dụ workspace chung dùng gần nhất), hay người dùng phải tự chọn ô Ngữ cảnh nhóm?
9. Khi tin gốc trong kênh bị sửa hoặc bị xóa, highlight cho agent (là bản chụp) xử lý thế nào? Hiện chưa có chức năng sửa tin nên để sau.
