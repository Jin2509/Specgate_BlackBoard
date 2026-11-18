*** Nội dung của file này là trình bày ý tưởng thiết kế một webiste mang tính ứng dụng cho môn học kiểm chứng phần mềm

Về mặt kỹ thuật:
1. Front-end mình muốn sử dụng nextjs và bộ icon không phải hệ thống, giao diện mang tính hiện đại, màu tối
2. Back-end mình muốn viết bằng python 
3. Dùng FastApi
5. Dùng superbase làm db

Về mặt ý tưởng:
1. Chức năng dành cho website môn học kiểm chứng:
1.1 Problem: Người dùng khi lên ý tưởng phải lọc thông tin từ Agent, sau đó ra được ý tưởng thì lại copy gửi cho người khác, nếu người khac copy những gì được qua một agnet khác hay kết thúc phiên làm việc, agent sẽ không hiểu ngữ cảnh dẫn đến mất thơi gian trong truy xuất và tốc dộ tổng hợp thông tin và lên ý tưởng. Do đó, cần một workspace chung để các người dùng có thể thao tác trên đó, tuy nhiên nếu người dùng muốn một workspace riêng thì vẫn có thể đáp ứng nhu cầu. Khi nào có resquest muốn dùng workspace chung ( ví dụ như yêu cầu join) thì sẽ tham gia workspace chung để tổng hợp thông tin. 
2. Đây có thể là một trang LLM nhưng mà multiLLM hoặc gọi ngắn gọn kênh chat mà chủ thể có thể là con người hoặc LLM và giao tiếp qua api_key, lệnh ,...
3. Triển khai ý tưởng 1 và 2. Mở rộng các chức năng hết mức có thể, tuy nhiên chỉ gom gọn trong 4 tuần, sau đó thực hiện chia sprint


Yêu cầu sau khi brainstorm:

Xem xét ý tưởng trên có khả thi không? Sau đó trình bày hướng thực hiện cùng cách làm.

Trình bày một file.pdf về ý tưởng triển khai công nghệ

Một file sprint phân công nhiệm vụ cho 4 người trong khoảng 3 tuần ( sprint = 1 tuần)

Brainstorm và cho mình kết quả.

----- Script2:

Mình cần bạn thực hiện thực các luồng sau. Trươc hết là khi vào website bạn phải đăng nhập bằng github hoặc google ( chỉ 2 phương thức đó). Sau đó chưa vào màn hình workspace riêng trước, vì bạn chưa join bất kì workspace chung nào mà, sau đó nếu muốn tham gia workspace chung thì cần người dùng  khác share cho cái code (code này hệ thống tự sinh khi ấn share code tương tự như microsoft temass) và khi nhập sẽ chờ xác nhận để join team (workspace chung). Rồi sau đó mới thực hiện các luồng hiện tại là hiển thị đầy đủ

----- Script3: 

Có thêm môt phần tạo kênh chung và invite thông qua mail hoặc github

Hơn hết vấn đề workspace chung riêng đang có sự hiểu lầm thì phải, lúc mới đầu tạo tài khoản hoặc taig khoản đó chưa có tham gia 1 workspace nào thì đâu có workspace đâu mà khi đăng nhập là đã xuất hiện workspaec rồi (tạo workspace cần nhập api_key của agent rồi call tói, hoặc chỉ hiển thị kênh chat rỗng) rồi khi tham gia hoặc tự mình tạo 1 workspace thì mới có workspace chung, còn workspace riêng là mình làm cá nhân, giống trang LLM thôi.

Thay đổi lại logo của website, hơn hết đừng có thêm các màu vào trạng thái (đề xuất, đang bàn gì đó)


---- Scrip4:

Mình muốn định nghĩa lại các vấn đề sau:

Về workspace riêng, người dùng nhập api key từ một agnet và sẽ prompt trong đó như một trang LLM của con agent đó. Ngoài ra việc nhập exention hay ngoài api_key thì mình xem đó là egde case không đưa vào project. Việc mình hỏi bạn là nó có thể thực hiện khả thi không?

Trả lời và giải thích chi tiết:

Thứ hai, về problem mình đã bàn lại với nhóm thì website này nó giải quyết các vấn đề sau:
Bạn A và bạn B đang lên ý tưởng và cần agent gen ra và đọc lại để chốt idea. Tuy nhiên, bạn A dùng agnet này, B dùng cái kia hoặc dùng chung 1 họ agnet thì lại gặp vấn đề chung 1 chỗ": Việc làm riêng trên 2 máy mà k có phiên giao nhau dẫn đến khi call agent có sẽ không hiểu context, sinh lại các giả thuyết out of scrop,.. Điều đó là vấn đề mình cần 1 workspace chung để hiện thực hóa được các vấn đề này.

Thứ ba, về hướng gọi các "nội dung" thống nhất, cần có 2 mode sau:
1. Mode highlight ( con người sẽ hightlight trực tiếp ở workspace riêng những nội dung con người đã chốt hoặc cảm thấy cần thảo luận) sau đó sẽ @ những đoạn hightlight từ workspace riêng của mình vào  workspace chung 
2. Mode 2 là sẽ @ toàn bộ đoạn chat vào workspace chung và để discuss các thông tin

-> Cùng một thời điểm, con người và trí tuệ nhân tạo có thể làm việc

Mục đích là nâng cao hiệu suất, tránh mất context.


Mình cần bạn phanr hồi lại ideal sau đó xem xét tính khả thi của ideal trên có hiện thực được không? 

Trả lời vào file