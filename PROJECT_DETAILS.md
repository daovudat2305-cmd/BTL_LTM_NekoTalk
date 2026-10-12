# 📘 BÁO CÁO KỸ THUẬT VÀ KIẾN TRÚC HỆ THỐNG NEKOTALK
## HỌC PHẦN: LẬP TRÌNH MẠNG (NETWORK PROGRAMMING)

> 🎓 **Tài liệu tham khảo chuyên sâu:**  
> Tài liệu này mô tả chi tiết toàn bộ ngăn xếp công nghệ, lý do lựa chọn kỹ thuật, các nguyên lý và kiến thức Lập trình mạng cốt lõi được áp dụng trong hệ thống **NekoTalk**, đồng thời cung cấp bộ câu hỏi vấn đáp chuẩn bị cho buổi bảo vệ Bài tập lớn.

---

## 📑 MỤC LỤC
1. [Tổng Quan Hệ Thống & Bối Cảnh Dự Án](#1-tổng-quan-hệ-thống--bối-cảnh-dự-án)
2. [Ngăn Xếp Công Nghệ & Phân Tích Lý Do Lựa Chọn (Technology Stack & Rationale)](#2-ngăn-xếp-công-nghệ--phân-tích-lý-do-lựa-chọn)
3. [Kiến Thức Lập Trình Mạng Được Áp Dụng (Core Network Concepts)](#3-kiến-thức-lập-trình-mạng-được-áp-dụng)
   - [3.1 Mô hình Phân tầng Mạng (OSI & TCP/IP)](#31-mô-hình-phân-tầng-mạng-osi--tcpip)
   - [3.2 Tầng Giao vận: So sánh TCP và UDP trong Ứng dụng](#32-tầng-giao-vận-so-sánh-tcp-và-udp-trong-ứng-dụng)
   - [3.3 Tầng Ứng dụng: HTTP vs WebSocket vs STOMP Protocol](#33-tầng-ứng-dụng-http-vs-websocket-vs-stomp-protocol)
   - [3.4 Truyền thông Ngang hàng (P2P), WebRTC và Kỹ thuật NAT Traversal](#34-truyền-thông-ngang-hàng-p2p-webrtc-và-kỹ-thuật-nat-traversal)
   - [3.5 Bảo mật Mạng & Cơ chế Xác thực Phân tán (JWT & Interceptors)](#35-bảo-mật-mạng--cơ-chế-xác-thực-phân-tán-jwt--interceptors)
   - [3.6 Ảo hóa Mạng và Container Networking trong Docker](#36-ảo-hóa-mạng-và-container-networking-trong-docker)
4. [Sơ Đồ Trình Tự & Luồng Giao Tiếp Mạng (Sequence Diagrams)](#4-sơ-đồ-trình-tự--luồng-giao-tiếp-mạng)
5. [Bộ Câu Hỏi Vấn Đáp Bảo Vệ Đồ Án Lập Trình Mạng (Q&A Defense Guide)](#5-bộ-câu-hỏi-vấn-đáp-bảo-vệ-đồ-án-lập-trình-mạng)

---

## 🌐 1. TỔNG QUAN HỆ THỐNG & BỐI CẢNH DỰ ÁN

### 1.1 Đặt vấn đề
Trong kỷ nguyên số, các ứng dụng trao đổi thông tin thời gian thực (Real-time Communication - RTC) như Slack, Discord, Telegram hay Zalo đóng vai trò huyết mạch. Tuy nhiên, việc xây dựng một hệ thống truyền thông đa phương tiện đặt ra nhiều thách thức lớn về mạng máy tính:
- Làm thế nào để **đẩy dữ liệu tức thì** từ server xuống client mà không lãng phí tài nguyên đường truyền bởi cơ chế Polling?
- Làm thế nào để truyền tải **âm thanh và video chất lượng cao** với độ trễ tính bằng mili-giây mà không làm sập băng thông của máy chủ trung tâm?
- Làm sao để **bảo vệ và phân quyền** trên các kết nối socket tồn tại lâu dài (persistent connections)?

### 1.2 Mục tiêu của NekoTalk
**NekoTalk** là hệ thống giao tiếp đa nền tảng kết hợp mô hình **Client-Server** và **Peer-to-Peer (P2P)**, cung cấp:
1. Nhắn tin văn bản thời gian thực (Instant Messaging) 1-1 và theo nhóm.
2. Quản lý trạng thái trực tuyến (Presence) và thông báo nhập liệu (Typing indicator).
3. Đính kèm tệp tin và hình ảnh (`MessageMedia`).
4. Đàm thoại âm thanh (Voice Call) và hình ảnh (Video Call) ngang hàng chất lượng cao.
5. Đóng gói triển khai độc lập, tự động hóa 100% bằng Docker Compose.

```
                    ┌────────────────────────────────────────────────────────┐
                    │                   HỆ THỐNG NEKOTALK                    │
                    └────────────────────────────────────────────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
     [Phân hệ Text & Presence]                                     [Phân hệ Voice & Video Call]
     - Mô hình: Client - Server                                    - Mô hình: Hybrid P2P
     - Giao thức: HTTP REST + WebSocket/STOMP                      - Giao thức: WebRTC (RTP/RTCP trên UDP)
     - Trung gian: In-Memory Message Broker                        - Trung gian: Spring Boot làm Signaling Server
```

---

## ⚙️ 2. NGĂN XẾP CÔNG NGHỆ & PHÂN TÍCH LÝ DO LỰA CHỌN

| Tầng hệ thống | Công nghệ sử dụng | Lý do lựa chọn & Phân tích kỹ thuật (Trade-offs) |
|---|---|---|
| **Backend Framework** | **Java 21 LTS**<br>+ **Spring Boot 4.1.0** | - **Hiệu năng & Khả năng chịu tải:** Java 21 hỗ trợ Virtual Threads (Project Loom) cho phép phục vụ hàng chục nghìn kết nối đồng thời mà không nghẽn OS Threads.<br>- **Hệ sinh thái chuẩn công nghiệp:** Spring WebSocket cung cấp sẵn kiến trúc Message Broker (hỗ trợ STOMP over WebSocket) hoàn chỉnh.<br>- **Bảo mật mạnh mẽ:** Spring Security tích hợp liền mạch OAuth2 Resource Server và bộ lọc JWT.<br>- *So với Node.js:* Java có hệ thống kiểu dữ liệu tĩnh mạnh, mô hình đa luồng (multi-threading) thực sự, thích hợp cho hệ thống nghiệp vụ phức tạp. |
| **Frontend Framework** | **Next.js 16.3 (React 19)**<br>+ **TypeScript** | - **App Router & Server Components:** Tối ưu hóa render trang, khởi tạo nhanh, chia nhỏ bundle JS.<br>- **Type Safety tuyệt đối:** TypeScript đảm bảo tính toàn vẹn của cấu trúc gói tin gửi/nhận qua REST và WebSocket (tránh lỗi ngầm thời gian chạy).<br>- *So với React SPA thuần:* Next.js quản lý routing tốt hơn, tích hợp middleware bảo vệ route ở tầng edge. |
| **Giao thức Thời gian thực** | **WebSocket**<br>+ **STOMP Protocol** | - **WebSocket (RFC 6455):** Cung cấp kết nối 2 chiều (Full-Duplex) liên tục, overhead gói tin cực nhỏ (2 - 10 bytes header so với > 500 bytes của HTTP request).<br>- **STOMP Protocol:** Cung cấp lớp trừu tượng khung thông điệp (Frame-based messaging) với các lệnh chuẩn `CONNECT`, `SUBSCRIBE`, `SEND`. Không cần tự định nghĩa parser chuỗi JSON thủ công như khi dùng WebSocket thuần. |
| **Truyền thông Đa phương tiện** | **WebRTC (HTML5 API)**<br>+ **Google Public STUN** | - **Không tải server:** Âm thanh và hình ảnh truyền trực tiếp P2P giữa 2 máy khách, máy chủ Spring Boot chỉ tốn vài kilobyte làm nhiệm vụ chuyển tiếp tín hiệu bắt tay (Signaling).<br>- **Độ trễ siêu thấp (Sub-second latency):** Sử dụng UDP và cơ chế thích ứng băng thông động. |
| **Quản lý Trạng thái Client** | **Zustand** | - Cực nhẹ (~1.1 kB), không boilerplate như Redux.<br>- Hỗ trợ cập nhật state tức thời ngoài luồng React render, rất lý tưởng để hứng các sự kiện WebSocket dồn dập. |
| **Cơ sở dữ liệu** | **MySQL 8.0** | - **Tuân thủ ACID:** Đảm bảo toàn vẹn dữ liệu cho các quan hệ ràng buộc chặt chẽ (User, Conversation, Message, Participant).<br>- **Khóa ngoại & Indexing:** Tăng tốc truy vấn lịch sử chat theo thời gian (`sent_at DESC`) và hỗ trợ lưu trữ metadata đa phương tiện dạng JSON. |
| **Đóng gói & Ảo hóa** | **Docker & Docker Compose** | - **Tính nhất quán môi trường:** Đảm bảo hệ thống hoạt động 100% giống nhau giữa môi trường phát triển và máy tính chấm điểm của giảng viên.<br>- **Multi-stage Build:** Tối ưu kích thước image Backend (dùng JRE Alpine) và Frontend (Node Alpine). |

---

## 🧠 3. KIẾN THỨC LẬP TRÌNH MẠNG ĐƯỢC ÁP DỤNG

### 3.1 Mô hình Phân tầng Mạng (OSI & TCP/IP)

Dự án NekoTalk áp dụng đầy đủ các tầng trong mô hình mạng chuẩn TCP/IP:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TẦNG ỨNG DỤNG (APPLICATION)                     │
│  - HTTP/1.1 (REST API, Auth, History)                                  │
│  - WebSocket RFC 6455 (Persistent Socket Handshake)                    │
│  - STOMP Protocol (Publish/Subscribe Messaging)                        │
│  - SDP / WebRTC API (Media Session Negotiation)                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                        TẦNG GIAO VẬN (TRANSPORT)                       │
│  - TCP (Độ tin cậy, truyền tin nhắn văn bản, REST, WebSocket)         │
│  - UDP (Truyền tải âm thanh/hình ảnh thời gian thực qua RTP/RTCP)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                        TẦNG LIÊN MẠNG (INTERNET)                       │
│  - IPv4 / IPv6 Addressing                                              │
│  - NAT (Network Address Translation) & ICE Traversal (STUN/TURN)       │
│  - Docker Virtual Bridge Network (172.x.x.x Subnet)                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                      TẦNG TRUY CẬP MẠNG (NETWORK ACCESS)               │
│  - Ethernet, Wi-Fi 802.11, Docker Virtual NIC (veth)                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Tầng Giao vận: So sánh TCP và UDP trong Ứng dụng

Một trong những điểm sáng tạo nổi bật của NekoTalk là việc **ứng dụng hài hòa cả 2 giao thức cốt lõi của Tầng Giao vận (Transport Layer)** tùy theo tính chất dữ liệu:

```
                  ┌──────────────────────────────────────────────┐
                  │       LỰA CHỌN GIAO THỨC TẦNG GIAO VẬN       │
                  └──────────────────────┬───────────────────────┘
                                         │
             ┌───────────────────────────┴───────────────────────────┐
             ▼                                                       ▼
   [TCP - Transmission Control Protocol]                   [UDP - User Datagram Protocol]
   - Hướng kết nối (Connection-oriented)                   - Không hướng kết nối (Connectionless)
   - Bắt tay 3 bước (3-Way Handshake)                      - Header tối giản (8 bytes vs 20+ bytes)
   - Đảm bảo toàn vẹn & Đúng thứ tự (ACK/Retransmit)       - Không đảm bảo thứ tự, không retransmission
   - Kiểm soát tắc nghẽn & luồng (Sliding Window)          - Bắn gói tin liên tục với độ trễ cực thấp
   ─────────────────────────────────────                   ─────────────────────────────────────
   👉 ÁP DỤNG TRONG NEKOTALK:                              👉 ÁP DỤNG TRONG NEKOTALK:
      • HTTP/1.1 REST API                                     • Luồng Media WebRTC (RTP/RTCP)
      • WebSocket / STOMP (Chat Text)                         • Thoại và Video Call P2P
      (Tin nhắn văn bản không thể mất mát!)                   (Mất 1 frame hình chấp nhận được,
                                                               nhưng không thể chấp nhận trễ tiếng!)
```

#### Chi tiết nguyên lý TCP được áp dụng:
1. **3-Way Handshake (`SYN` ➔ `SYN-ACK` ➔ `ACK`):**
   - Thiết lập kết nối tin cậy giữa Browser và Server Spring Boot trước khi truyền dữ liệu HTTP hay nâng cấp lên WebSocket.
2. **Kiểm soát luồng (Flow Control) & Kiểm soát tắc nghẽn (Congestion Control):**
   - Sử dụng cơ chế Cửa sổ trượt (Sliding Window), Thuật toán Khởi động chậm (Slow Start) và Tránh tắc nghẽn (Congestion Avoidance) để điều tiết lượng dữ liệu gửi đi phù hợp với khả năng tiếp nhận của client.
3. **Độ tin cậy tuyệt đối:**
   - Đảm bảo các tin nhắn chat văn bản không bao giờ bị rơi rụng (packet loss) hay đảo lộn thứ tự thời gian.

#### Chi tiết nguyên lý UDP được áp dụng:
1. **Truyền tải âm thanh/hình ảnh thời gian thực:**
   - Dữ liệu giọng nói nếu bị trễ hơn **200ms** sẽ làm cuộc hội thoại bị gián đoạn và khó chịu. Nếu sử dụng TCP, khi mất 1 gói tin, toàn bộ luồng dữ liệu phía sau sẽ bị chặn lại để chờ gửi lại (Head-of-Line Blocking).
   - UDP truyền dữ liệu trực tiếp không chờ ACK, chấp nhận mất một vài mẫu âm thanh nhỏ (được thuật toán nén âm thanh như Opus che giấu) để giữ cho cuộc gọi luôn diễn ra trong thời gian thực.

---

### 3.3 Tầng Ứng dụng: HTTP vs WebSocket vs STOMP Protocol

#### 1. Sự hạn chế của HTTP truyền thống trong bài toán Real-time
- **Stateless & Bán song công (Half-Duplex):** Client luôn phải là bên chủ động gửi Request, Server chỉ có thể gửi Response phản hồi lại mà không thể chủ động đẩy (Push) dữ liệu xuống khi có tin nhắn mới.
- **Chi phí Overhead lớn:** Mỗi HTTP Request đều mang theo bộ Header cồng kềnh (Cookie, User-Agent, Cache-Control... từ 500 bytes đến 2 KB).
- **Các kỹ thuật thay thế cũ:**
  - *Short Polling:* Client liên tục gửi request mỗi 2 giây -> Lãng phí 99% tài nguyên server khi không có tin nhắn mới.
  - *Long Polling:* Giữ kết nối mở cho đến khi có dữ liệu -> Tốn số lượng connection trên server, overhead thiết lập kết nối lại liên tục.

#### 2. Giao thức WebSocket (RFC 6455)
WebSocket giải quyết triệt để vấn đề bằng cách cung cấp kết nối **Toàn song công (Full-Duplex)** trên một kênh TCP duy nhất tồn tại lâu dài (Persistent Connection).

**Quá trình Bắt tay (WebSocket Handshake):**
Kết nối bắt đầu bằng một HTTP GET Request với các Header đặc biệt:
```http
GET /ws HTTP/1.1
Host: localhost:8080
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```
Server phản hồi mã trạng thái `101 Switching Protocols`:
```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```
Sau bước này, giao thức HTTP kết thúc, kênh truyền chính thức chuyển thành đường ống nhị phân WebSocket 2 chiều với Header siêu nhẹ (chỉ từ 2 đến 10 bytes).

#### 3. Tại sao NekoTalk sử dụng STOMP trên nền WebSocket?
WebSocket thuần túy chỉ vận chuyển mảng byte hoặc chuỗi văn bản thô, nó **không định nghĩa**:
- Làm sao để đăng ký nhận tin của một phòng chat cụ thể?
- Làm sao để gửi riêng tin nhắn cho một người dùng mà người khác không nhận được?
- Cấu trúc tiêu đề (Header) và định tuyến (Routing) như thế nào?

**STOMP (Simple Text Oriented Messaging Protocol)** là giao thức tầng con chạy bên trong WebSocket (Sub-protocol), định nghĩa mô hình **Publish / Subscribe (Pub/Sub)** với các khung thông điệp (Frames) có cấu trúc:

```
COMMAND
header1:value1
header2:value2

Body content^@
```

**Các khung STOMP cơ bản trong NekoTalk:**
1. **CONNECT / CONNECTED:** Xác thực và thiết lập phiên STOMP.
2. **SUBSCRIBE:** Đăng ký lắng nghe kênh:
   - `/topic/conversations/{id}`: Kênh broadcast cho mọi thành viên trong hội thoại.
   - `/user/queue/messages`: Kênh riêng tư cá nhân (Điểm - Điểm) của từng người dùng.
3. **SEND:** Gửi thông điệp từ Client lên Server tại prefix `/app/...`.
4. **MESSAGE:** Server đẩy thông điệp từ Message Broker xuống các Client đã subscribe.

---

### 3.4 Truyền thông Ngang hàng (P2P), WebRTC và Kỹ thuật NAT Traversal

#### 1. Thách thức lớn của mạng Internet: Vấn đề NAT (Network Address Translation)
Hầu hết máy tính cá nhân hiện nay đều nằm sau bộ định tuyến (Router Wi-Fi) và được cấp địa chỉ IP cục bộ riêng tư (Private IP dạng `192.168.x.x` hoặc `10.x.x.x`). Các máy tính này **không thể tự nhìn thấy nhau trực tiếp qua Internet** vì địa chỉ IP thực thụ nhìn từ bên ngoài là Public IP của Router.

#### 2. Bộ ba công nghệ giải quyết NAT trong NekoTalk:
- **STUN (Session Traversal Utilities for NAT - RFC 5389):**
  - Trình duyệt gửi gói tin UDP đến máy chủ STUN công cộng của Google (`stun:stun.l.google.com:19302`). Máy chủ STUN sẽ phản hồi lại chính Public IP và Port mà Router của client dùng để liên lạc ra ngoài (Server Reflexive Candidate).
- **TURN (Traversal Using Relays around NAT - RFC 5766):**
  - Đóng vai trò máy chủ trung chuyển (Relay) dữ liệu khi gặp loại NAT nghiêm ngặt (Symmetric NAT) không thể đục lỗ (Hole punching).
- **ICE (Interactive Connectivity Establishment - RFC 8445):**
  - Bộ khung thuật toán tổng hợp tất cả các ứng viên đường truyền (Host candidate - IP LAN, srflx candidate - IP Public qua STUN, relay candidate qua TURN) và tiến hành thử nghiệm kết nối từng cặp để chọn ra đường truyền P2P tối ưu nhất.

#### 3. Giao thức SDP (Session Description Protocol)
Trước khi kết nối P2P diễn ra, 2 trình duyệt cần trao đổi "hồ sơ năng lực" qua SDP:
- Mã hóa âm thanh/hình ảnh hỗ trợ (Opus, VP8, H.264).
- Độ phân giải, tốc độ khung hình (FPS), băng thông khả dụng.
- Cơ chế mã hóa khóa bảo mật DTLS (Datagram Transport Layer Security).

#### 4. Vai trò của Signaling Server
WebRTC **không quy định giao thức trao đổi tín hiệu ban đầu**. NekoTalk tận dụng chính hệ thống WebSocket/STOMP sẵn có của Spring Boot để làm **Signaling Server** chuyển giao SDP Offer, SDP Answer và các ICE Candidates giữa hai người dùng trước khi luồng media P2P trực tiếp được hình thành.

---

### 3.5 Bảo mật Mạng & Cơ chế Xác thực Phân tán (JWT & Interceptors)

Hệ thống triển khai mô hình xác thực **Stateless Authentication** bằng JSON Web Token (JWT):

```
       [Client Browser]                                      [Spring Boot Server]
              │                                                        │
              │── 1. POST /api/auth/login (username/password) ────────>│
              │                                                        │ (Xác thực với DB)
              │<── 2. Cấp Access Token (15m) & Refresh Token (7d) ─────│ (Ký số HMAC/RSA)
              │                                                        │
              │                                                        │
              │── 3. HTTP Request + Header: Bearer <AccessToken> ─────>│── (Spring Security
              │                                                        │    Filter kiểm tra)
              │                                                        │
              │── 4. STOMP CONNECT frame + Header: Authorization ─────>│── (ClientInbound-
              │                                                        │    Authentication
              │                                                        │    Interceptor kiểm tra)
```

#### Bảo vệ kết nối WebSocket qua ChannelInterceptor:
Do giao thức WebSocket chỉ thực hiện HTTP Handshake một lần duy nhất lúc mở cổng, các bản tin STOMP trao đổi sau đó không gửi kèm header HTTP truyền thống. NekoTalk cài đặt lớp `ClientInboundAuthentication` can thiệp vào tầng vào/ra của kênh tin nhắn (`ChannelInterceptor`):
- Chặn bắt frame lệnh `StompCommand.CONNECT`.
- Trích xuất token từ header `nativeHeaders.get("Authorization")`.
- Giải mã và xác thực chữ ký số bằng `CustomJwtDecoder`.
- Gán đối tượng `Authentication` vào `StompHeaderAccessor.setUser(authentication)`, đảm bảo Spring Message Broker nhận biết chính xác danh tính người gửi cho từng packet.

---

### 3.6 Ảo hóa Mạng và Container Networking trong Docker

Dự án được cấu hình mạng ảo hóa trong [docker-compose.yml](./docker-compose.yml) với driver **Bridge Network**:

```yaml
networks:
  nekotalk-network:
    driver: bridge
```

#### Các nguyên lý mạng container được áp dụng:
1. **User-defined Bridge Network:**
   - Tạo ra một switch ảo cách ly hoàn toàn với mạng bên ngoài. Các container trong mạng được cấp phát địa chỉ IP thuộc cùng một subnet riêng.
2. **Cơ chế DNS Phân giải tên miền nội bộ (Embedded DNS Server):**
   - Các container không cần hardcode địa chỉ IP tĩnh mà gọi nhau qua tên service:
     - Backend kết nối MySQL bằng URL: `jdbc:mysql://nekotalk-mysql:3306/chat_online`.
     - Docker Daemon tự động phân giải tên `nekotalk-mysql` thành IP container tương ứng.
3. **Cơ chế Ánh xạ cổng (Port Mapping) & NAT:**
   - Docker sử dụng quy tắc `iptables` trên máy Host để chuyển tiếp cổng (Port Forwarding):
     - `3000:3000` -> Mở cổng giao diện web cho máy người dùng truy cập.
     - `8080:8080` -> Mở cổng API và WebSocket cho client kết nối.
     - `3306:3306` -> Mở cổng Database cho các công cụ quản trị (DBeaver, MySQL Workbench).
4. **Health Check Dependency:**
   - Container `server` phụ thuộc vào trạng thái `condition: service_healthy` của MySQL (kiểm tra qua `mysqladmin ping`), ngăn ngừa lỗi đứt gãy kết nối mạng khi backend khởi động nhanh hơn database.

---

## 🔄 4. SƠ ĐỒ TRÌNH TỰ & LUỒNG GIAO TIẾP MẠNG

### 4.1 Luồng Gửi & Nhận Tin Nhắn Văn Bản (Message Dispatch Flow)

```
[Client A]                   [Server Spring Boot]                 [MySQL]              [Client B]
    │                                 │                              │                     │
    │── 1. POST /api/chat-messages ──>│                              │                     │
    │      (Kèm Bearer Token)         │── 2. Validate JWT & Member ──│                     │
    │                                 │── 3. Lưu ChatMessage ───────>│                     │
    │                                 │<── 4. DB Commit thành công ──│                     │
    │                                 │                              │                     │
    │                                 │── 5. Bắn ChatMessageCreatedEvent                   │
    │                                 │   (TransactionalEventListener)                     │
    │                                 │                                                    │
    │<── 6. Response HTTP 200 OK ─────│── 7. STOMP Broker đẩy tin nhắn ───────────────────>│
    │      (Hiển thị tin nhắn gửi)    │      (convertAndSendToUser)                        │
    │                                 │      Destination: /user/{B}/queue/messages         │
    │                                 │                                                    │
    │                                 │                                      (Client B cập nhật
    │                                 │                                       Zustand & render UI)
```

### 4.2 Luồng Thiết Lập Cuộc Gọi WebRTC P2P (Signaling via STOMP)

```
[Browser A (Caller)]             [Spring Boot (Signaling)]            [Browser B (Callee)]
        │                                    │                                  │
        │── 1. STOMP SEND /app/call.request ─>│                                  │
        │                                    │── 2. STOMP MESSAGE ─────────────>│
        │                                    │   /user/{B}/queue/call.incoming  │
        │                                    │                                  │
        │                                    │<── 3. STOMP SEND /app/call.accept│
        │<── 4. STOMP MESSAGE ───────────────│                                  │
        │   /user/{A}/queue/call.accepted    │                                  │
        │                                    │                                  │
        │── 5. Tạo SDP Offer & gửi ─────────>│                                  │
        │   /app/call.sdp                    │── 6. Chuyển tiếp SDP Offer ──────>│
        │                                    │                                  │
        │                                    │<── 7. Tạo SDP Answer & gửi ──────│
        │<── 8. Chuyển tiếp SDP Answer ──────│   /app/call.sdp                  │
        │                                    │                                  │
        │── 9. Trao đổi ICE Candidates ─────>│── 10. Chuyển tiếp Candidate ────>│
        │<── 12. Chuyển tiếp Candidate ──────│<── 11. Trao đổi ICE Candidates ──│
        │                                    │                                  │
        │═══════════════════════════════════════════════════════════════════════│
        │  13. KẾT NỐI P2P THÀNH CÔNG (Direct Media Stream qua UDP/RTP)         │
        │   Âm thanh & Hình ảnh truyền trực tiếp, không qua máy chủ Spring Boot  │
        │═══════════════════════════════════════════════════════════════════════│
```

---

## 🎯 5. BỘ CÂU HỎI VẤN ĐÁP BẢO VỆ ĐỒ ÁN LẬP TRÌNH MẠNG

Dưới đây là tổng hợp 10 câu hỏi cốt lõi mà Hội đồng Giảng viên thường đặt ra khi chấm Bài tập lớn môn Lập trình mạng, cùng câu trả lời chuẩn xác nhất:

### Câu 1: Tại sao nhóm không dùng HTTP thông thường để làm chat mà phải dùng WebSocket?
> **Trả lời:**  
> HTTP là giao thức nửa song công (Half-duplex), hoạt động theo cơ chế Stateless Request-Response. Máy chủ không thể chủ động đẩy (Push) dữ liệu xuống máy khách khi có tin nhắn mới mà máy khách phải liên tục gửi request thăm dò (Polling), gây lãng phí băng thông (overhead hàng trăm bytes header cho mỗi request) và tăng độ trễ.  
> WebSocket mở một kênh kết nối toàn song công (Full-duplex) duy nhất trên nền TCP, cho phép cả Client và Server trao đổi dữ liệu 2 chiều bất cứ lúc nào với header chỉ từ 2–10 bytes, đáp ứng thời gian thực tức thì.

### Câu 2: Quá trình Handshake của WebSocket diễn ra như thế nào? Tại sao nó bắt đầu bằng cổng HTTP?
> **Trả lời:**  
> WebSocket tận dụng hạ tầng HTTP sẵn có (cổng 80/443) để dễ dàng đi qua các Tường lửa (Firewall) và Proxy mạng. Quá trình Handshake bắt đầu bằng một HTTP GET request mang header `Upgrade: websocket` và `Connection: Upgrade`, đi kèm khóa ngẫu nhiên `Sec-WebSocket-Key`. Server kiểm tra, băm khóa với GUID chuẩn bằng SHA-1 và trả về header `Sec-WebSocket-Accept` với mã trạng thái `101 Switching Protocols`. Từ thời điểm này, kết nối HTTP được nâng cấp thành kết nối socket nhị phân liên tục.

### Câu 3: STOMP là gì và tại sao lại cần STOMP khi đã có WebSocket?
> **Trả lời:**  
> WebSocket là giao thức tầng truyền tải frame nhị phân/chuỗi thô, nó không quy định định dạng thông điệp (Message format) hay cách định tuyến (Routing).  
> STOMP (Simple Text Oriented Messaging Protocol) là giao thức tầng ứng dụng chạy trên WebSocket, bổ sung cơ chế Publish/Subscribe (Pub/Sub) có cấu trúc dạng khung lệnh (`CONNECT`, `SUBSCRIBE`, `SEND`, `MESSAGE`). STOMP giúp phân tách rõ ràng giữa các kênh broadcast chung (`/topic/...`) và kênh điểm-điểm của từng người (`/user/queue/...`), giúp lập trình viên không phải tự xây dựng bộ parser định tuyến thủ công.

### Câu 4: Phân biệt cơ chế `/topic` và `/queue` trong Spring Message Broker?
> **Trả lời:**  
> - `/topic`: Sử dụng cho mô hình phát quảng bá (Broadcast 1-Nhiều / Pub-Sub). Khi một thông điệp được gửi vào topic, tất cả các máy khách đang subscribe kênh đó đều nhận được bản sao thông điệp (áp dụng cho phòng chat nhiều người).
> - `/queue`: Sử dụng cho mô hình điểm-điểm (Point-to-Point / Unicast 1-1). Thông điệp chỉ được gửi đích danh tới một phiên làm việc cụ thể của một người dùng duy nhất (áp dụng cho tin nhắn riêng tư hoặc tín hiệu gọi điện).

### Câu 5: Trong tính năng gọi Video/Audio, tại sao lại dùng WebRTC thay vì gửi video qua WebSocket?
> **Trả lời:**  
> Dữ liệu video và âm thanh có dung lượng rất lớn. Nếu truyền qua WebSocket:
> 1. Toàn bộ lưu lượng media sẽ đổ dồn lên Server trung tâm, làm nghẽn băng thông và tiêu tốn CPU xử lý.
> 2. WebSocket chạy trên TCP. Cơ chế truyền lại gói tin khi mất mát của TCP sẽ gây hiện tượng Head-of-Line Blocking, khiến cuộc gọi bị lag, giật và trễ hình nghiêm trọng.  
> WebRTC truyền trực tiếp P2P giữa hai trình duyệt qua giao thức UDP/RTP, không tốn băng thông của máy chủ và có độ trễ cực thấp (dưới 100ms). Server chỉ làm nhiệm vụ Signaling (chuyển tiếp tín hiệu bắt tay ban đầu).

### Câu 6: Trình bày vai trò của STUN và TURN server trong WebRTC? Khi nào thì bắt buộc phải có TURN?
> **Trả lời:**  
> - **STUN (Session Traversal Utilities for NAT):** Giúp thiết bị nằm sau mạng LAN tìm ra địa chỉ Public IP và Port thực tế của chính nó nhìn từ ngoài Internet.
> - **TURN (Traversal Using Relays around NAT):** Đóng vai trò máy chủ trung gian chuyển tiếp luồng media khi hai thiết bị không thể kết nối trực tiếp với nhau.  
> **Bắt buộc dùng TURN** khi một hoặc cả hai thiết bị nằm sau Symmetric NAT (loại NAT nghiêm ngặt thường thấy ở mạng 4G di động hoặc tường lửa công ty), nơi Router thay đổi port ngẫu nhiên cho mỗi đích kết nối, khiến kỹ thuật đục lỗ NAT (NAT Hole Punching) thất bại.

### Câu 7: Làm thế nào để xác thực người dùng trên kết nối WebSocket khi mà WebSocket Handshake không hỗ trợ gửi kèm Header tùy biến chuẩn trong một số trình duyệt?
> **Trả lời:**  
> Trong dự án NekoTalk, việc xác thực được bảo vệ ở 2 lớp:
> 1. Ở tầng Handshake: Sử dụng `HandshakeInterceptor` trích xuất thông tin cookie hoặc URL query parameter.
> 2. Ở tầng STOMP Messaging: Đây là cách tiếp cận chuẩn mực nhất. Khi client gửi khung STOMP `CONNECT`, client đính kèm Header `Authorization: Bearer <JWT>` vào khung này. Lớp `ClientInboundAuthentication` (triển khai `ChannelInterceptor`) của Spring Boot sẽ chặn bắt frame này, xác thực chữ ký số của token và gán `Principal` vào phiên làm việc. Nếu token không hợp lệ, kết nối sẽ bị từ chối ngay lập tức.

### Câu 8: Tại sao lại áp dụng mô hình kiến trúc lai (Hybrid) REST API kết hợp WebSocket thay vì đưa toàn bộ chức năng vào WebSocket?
> **Trả lời:**  
> - **REST API (HTTP Stateless):** Tối ưu cho các tác vụ CRUD dữ liệu tĩnh, tần suất thấp như đăng ký, đăng nhập, tải lịch sử tin nhắn cũ có phân trang (pagination), tải danh sách hội thoại. Việc dùng REST giúp tận dụng cơ chế Caching của trình duyệt và giảm bớt gánh nặng lưu giữ trạng thái trên socket.
> - **WebSocket (Stateful Full-Duplex):** Dành riêng cho các luồng dữ liệu cần phản hồi tức thì như nhận tin nhắn mới, thông báo trạng thái online/offline, typing indicator và signaling cuộc gọi.  
> Sự kết hợp này mang lại hiệu năng cao nhất và dễ bảo trì, mở rộng hệ thống (Scalability).

### Câu 9: Trình bày cơ chế mạng Docker Container trong dự án? Làm sao Backend tìm thấy MySQL?
> **Trả lời:**  
> Dự án sử dụng mạng ảo hóa **User-defined Bridge Network** (`nekotalk-network`). Khi khởi chạy, Docker Daemon tạo một cầu nối mạng ảo cách ly và tích hợp sẵn một máy chủ **Embedded DNS Server**. Khi Backend cấu hình kết nối tới host `nekotalk-mysql`, Docker DNS sẽ tự động phân giải tên service này thành địa chỉ IP nội bộ tương ứng của container MySQL trong subnet.

### Câu 10: Giả sử hệ thống mở rộng lên hàng triệu người dùng trên nhiều máy chủ Backend khác nhau, kiến trúc WebSocket hiện tại sẽ gặp vấn đề gì và giải pháp là gì?
> **Trả lời:**  
> Hiện tại dự án đang sử dụng In-Memory Simple Broker của Spring Boot. Khi mở rộng ra mô hình phân tán (Multiple Server Instances sau Load Balancer), một User kết nối vào Server 1 sẽ không thể nhận được tin nhắn từ User kết nối vào Server 2 vì bộ nhớ broker của 2 máy chủ là tách biệt.  
> **Giải pháp:** Thay thế In-Memory Simple Broker bằng một **External Message Broker** chuyên dụng như **RabbitMQ** hoặc **Apache ActiveMQ / Redis Pub-Sub** hỗ trợ STOMP protocol. Lúc này tất cả các máy chủ Backend đều kết nối chung vào cụm Broker trung tâm, đảm bảo tin nhắn được phân phối thông suốt bất kể người dùng kết nối vào node nào.

---

## 📚 TÀI LIỆU TIÊU CHUẨN THAM KHẢO
1. **RFC 6455:** The WebSocket Protocol (IETF Standard).
2. **STOMP Protocol Specification:** Version 1.2 (stomp.github.io).
3. **RFC 8829:** JavaScript Session Establishment Protocol (JSEP / WebRTC).
4. **RFC 5389:** Session Traversal Utilities for NAT (STUN).
5. **Spring Framework Documentation:** WebSocket & STOMP Messaging Architecture.
6. **Docker Documentation:** Networking in Compose & Bridge Network Driver.
