# 使用其他编程语言加速PythonHttp请求速度

### 首先使用不同语言进行基本请求测试：

首先进行一个简单的测试，测试地址http://buttonwood.cn:8887。

测试时使用Netlimiter进行限速，**排除网速干扰**，统一限速10MB/s，同时在代码中同步进行请求，确保每一个个请求完成后再进行下一个请求。

初步结果如下，可以看到Python运行速度较慢，本文将从几方面探讨原因并最后给出解决方案，测试代码在文章末尾。

- C++ Requests - Mean: 0.0247451 s, p999: 0.246649 s

- Rust Requests - Mean: 0.025771424100000002 s, p999: 0.2466526 s

- Python Requests - Mean: 0.03683946037292481 s, p999: 0.8602229425907206 s

  


### 现提出以下猜想：

- **库的实现效率不同**：不同语言的 HTTP 请求库由于底层实现策略的差异，可能在性能上表现出显著不同。Rust 和 C++ 通常允许开发者更灵活地控制系统资源，进行底层优化，而 Python 的 Requests 库相对更通用，可能引入额外的内存管理和上下文切换开销。

- **多线程处理和异步支持**：Rust 和 C++ 提供了高效的多线程和异步编程模型，这使得它们能够在处理并发请求时展现出更高的性能。而 Python 的 Requests 库是同步的，导致在并发场景下性能受限，需要借助其他异步库如 `aiohttp` 来提升效率。

- **网络处理差异**：不同语言的 HTTP 请求库对底层网络套接字的处理方式存在显著差异。C++ 和 Rust 的库通常提供更精细的控制，如连接池、数据缓冲、超时重试等优化策略，而 Python 的 Requests 库更注重易用性，可能缺乏类似的底层优化。

- **运行环境的差异**：作为解释型语言，Python的运行效率通常不如编译型语言如 C++ 和 Rust，尤其是在大量计算或高并发场景中，编译型语言的更高性能能够显现出显著优势。

  

### 下面来验证猜想：

#### 1. 首先测试库的实现效率差异

验证思路：

- 使用相同的服务器地址，在Python语言中调用自己编译的小型请求库，确保尽可能减少其他系统层面的干扰，专注于对比不同库的底层实现效率。

- 测试时不使用限速，观察请求响应时间的浮动情况。通过分析网络延迟的变化，可以判断不同库在处理网络请求时是否具有更高效的策略，如数据缓冲和连接重用。

- 比较**同步版本**的请求性能。Rust 和 C++ 提供的库通常会有高性能异步实现，而 Python Requests 是同步的，所以也确保其他库实现时也为同步

结果：

- Python Requests - Mean: 0.03683946037292481 s, p999: 0.8602229425907206 s

- Python + rust(pyo3) Requests - Mean: 0.035793 s, p999: 0.266559 s

- Python + C++(boost) Requests - Mean: 0.034819 s, p999: 0.076699 s 

可以发现，python、rust、c++，在同一个机器上请求同一网址，从发送请求到收到内容过程的耗时是不一样的，然而使用其他语言的单线程库并没有显著提高Python的运行速率，尽管py库浮动较大，但可能是因为策略不同，但平均请求时间差异不大，这说明Python与其他语言的运行差异在**平均请求效率**上**没有显著区别**，故python库虽然与C++采用了不同的实现，但是总的平均请求效率差异不大，故在单线程情况下，库的实现效率并没有显著差异。



#### 2. 多线程和**异步支持**

验证思路：

- 在多线程或异步环境中，进行并发请求，测试各语言处理大量请求的能力。可以通过不同数量的并发请求，比较 Python的`request`的单线程和多线程(自建)、Rust 的 `tokio`、以及 C++ 的异步库（如 `curl`）之间的性能差异。

- 分析**异步**处理，查看异步操作是否显著提升性能。


结果：

- Python 同步  - Mean: 0.02365283131599426 s, p999: 0.2452993628978736 s

- Python 异步 - Mean: 0.003968 s

- Python + rust 异步 - Mean: 0.003352 s

通过对比不同编程语言和并发模型下的 HTTP 请求性能，结果显示异步支持对请求速度有着显著的影响。Python 同步的请求平均耗时较长，而当引入线程池机制后，性能得到了**近 10 倍的提升**，进一步验证了并发处理在高并发场景中的重要性。Rust 的多线程性能甚至更进一步优化，表明像 Rust 这样的编译型语言在处理大量并发请求时的性能优势。

这表明，在需要处理大量请求的场景下，单线程的请求模式会成为瓶颈，而通过引入多线程或异步机制，可以有效地提高系统的吞吐量并缩短请求响应时间。此外，在使用**多线程**时，使用更底层、更接近系统的编程语言（如 **Rust提升18%**），结合高效的并发模型，能够进一步优化网络请求的性能，特别是在大规模并发任务下。对于实际应用，在选择 HTTP 请求库和语言时，应充分考虑并发处理的需求以及系统所能支持的最优模型。

#### 3. **网络处理差异**

验证思路：

- 通过网络协议分析工具（如 Wireshark）观察每次 HTTP 请求的具体网络流量，分析底层套接字的处理差异。
- 可以查看不同语言的库是否对请求头、重试机制、连接池等网络优化进行了差异化处理。例如，Rust 和 C++ 的库可能会更注重对底层连接的优化，Python 则可能依赖更多的默认实现。
- 设置不同的网络条件(1M 和 10M)，如增加延迟、带宽限制等，观察在不理想的网络环境下，各语言的 HTTP 请求库是否有不同的表现。

结果：
-  python 多线程 限速1MB/s Mean - 0.016422 s

- Python+rust 多线程 限速1MB/s - Mean: 0.006196 s

- python 多线程 限速10MB/s - Mean: 0.003239 s

- Python+rust 多线程 限速10MB/s - Mean: 0.003187 s

结果非常令人吃惊，python和rust在低网速情况下差异非常之大，在高网速时则没有体现出来，这一结果揭示了 Rust 在不理想的网络条件下，通过更优化的连接池、重试机制和资源管理，在处理大量并发 HTTP 请求时表现出了明显的优势。而 Python 虽然在高网络带宽条件下性能尚可，但在面对带宽限制、网络延迟等挑战时，其默认的实现策略显然不足以匹敌 Rust 的底层优化。

#### 4. **运行环境的差异**

验证思路：

- 通过编译和解释型语言的对比分析，测试在不同的运行环境中，各语言的性能表现差异。
- 通过比较C++中调用curl库，和boost.python调用C++的curl库来进行比对不同运行环境下的请求速度差异(同步)
- 通过比较rust中调用reqwest库，和python调用rust+pyo3+reqwest编译的python库来进一步比对不同运行环境下的请求速度差异(同步)

结果：

- C++(curl)- Mean: 0.0247451 s, p999: 0.246649 s

- Python + C++(curl) - Mean: 0.034819 s, p999: 0.076699 s 

- Rust(reqwest)- Mean: 0.0257714 s, p999: 0.2466526 s

- Python + rust(reqwest) - Mean: 0.035793 s, p999: 0.266559 s

结果并不令人意外，在同样调用 `curl` 或 `reqwest` 库的情况下，Python 的运行速度明显慢于 C++ 和 Rust。**主要原因**可能在于 Python 本身的解释型语言特性，以及其调用外部库时引入的绑定开销。

相比之下，C++ 和 Rust 都是编译型语言，直接调用底层网络库如 `curl` 和 `reqwest` 时，不会遇到太多额外的性能损耗。它们在处理网络请求时，可以更加高效地管理内存、系统调用，以及底层的 IO 操作，从而确保高性能和低延迟。而 Python 在调用这些底层库时，通过 `Boost.Python` 或 `PyO3` 等绑定，虽然可以复用 C++ 和 Rust 的高效实现，但由于 Python 运行时的特性，额外的上下文切换、数据类型转换等开销是不可避免的。



### 总结

Python 请求速度较慢的最主要原因并非底层 HTTP 请求库的效率，而是其运行环境的开销。作为解释型语言，Python 在处理每次请求时需要进行解释器与底层语言之间的交互，这会导致额外的上下文切换和数据转换开销，特别是在高负载或大量并发请求的场景下，这些开销会不断累积，造成明显的性能瓶颈。相比之下，编译型语言如 C++ 和 Rust 在内存管理、系统调用、以及 IO 操作上更为高效，这在低带宽，低性能的情况下差异，这使得它们在处理同步请求时能够提供显著的性能提升。

通过这些观察，可以得出以下提升 请求速度的建议：

1. **引入异步编程模型**：Python 的同步 `requests` 库性能较低，但通过引入异步库如 `aiohttp`，可以显著提升处理并发请求的能力，避免同步阻塞带来的性能瓶颈。
2. **多线程或多进程并发处理**：通过 Python 的 `concurrent.futures` 或 `multiprocessing` 库，利用多线程或多进程方式并发处理多个 HTTP 请求，可以在一定程度上提升吞吐量，减少同步阻塞造成的性能限制。
3. **使用高效的底层语言库**：在 Python 中使用 `Boost.Python` 或 `PyO3` 将 C++ 和 Rust 的高效 HTTP 请求库（如 `curl` 或 `reqwest`）绑定到 Python，能够有效减少请求处理中的瓶颈。虽然绑定会引入一些开销，但它仍然比 Python 原生实现更高效。
4. **优化网络条件下的处理**：在网络带宽或延迟较差的条件下，考虑通过 Rust 或 C++ 进行请求，这些语言的库（如 `reqwest` 和 `curl`）对连接池、重试机制、超时处理等底层优化更加精细，可以显著提升网络请求的可靠性和效率。
5. **直接使用 C++ 或 Rust 处理关键任务**：对于需要大量并发请求的性能敏感场景，直接使用 C++ 或 Rust 而不是通过 Python 进行请求处理，可以消除绑定开销，充分利用编译型语言的优势，最大化提高请求速度。





### 代码展示

#### 1. 基本请求测试和**库的实现效率测试**

Python代码如下:

```python
import requests
import time
import numpy as np

def test_python_requests(url, iterations=1000, max_retries=5):
    session = requests.Session()
    times = []

    for _ in range(iterations):
        success = False
        for attempt in range(max_retries):
            try:
                start_time = time.time()
                response = session.get(url, timeout=1)
                # response.raise_for_status()  # Ensure a valid response
                times.append(time.time() - start_time)
                print(time.time() - start_time)
                success = True
                break
            except requests.RequestException as e:
                print(f"Attempt {attempt + 1} failed: {e}")
                time.sleep(1)  # Optional delay before retrying

            if not success:
                print("Failed to connect after multiple attempts")
                return None

    mean_time = np.mean(times)
    p999_time = np.percentile(times, 99.9)

    return mean_time, p999_time

url = "http://buttonwood.cn:8887/"
mean_time, p999_time = test_python_requests(url)
if mean_time:
	print(f"Python Requests - Mean: {mean_time} s, p999: {p999_time} s")

```

rust代码如下（需安装reqwest）:

```rust
use reqwest;
use std::{thread::sleep, time::{Duration, Instant}};

#[tokio::main]
async fn main() {
let url = "http://buttonwood.cn:8887/";
let mut total_duration = Duration::new(0, 0);
let mut over999 = Duration::new(0, 0);
const N: usize = 1000;

// 创建一个带有超时设置的客户端
let client = reqwest::Client::builder()
.timeout(Duration::from_secs(1)) 
.build()
.unwrap();

for i in 0..N {
loop {
let start = Instant::now();
let response = client.get(url).send().await;
match response {
Ok(_) => {
let duration = start.elapsed();
println!("{}", duration.as_secs_f64());
total_duration += duration;
if duration > over999 {
over999 = duration;
}
break;
},
Err(_) => {
sleep(Duration::from_secs(1));
println!("请求 {} 失败", i);
}
}
}
}

let average_duration = total_duration.as_secs_f64() / (N as f64);
println!("Rust Requests - Mean: {} s, p999: {} s", average_duration, over999.as_secs_f64());
}

```

cpp代码如下(需添加curl库):

```c++
#include <iostream>
#include "curl/curl.h"
#include <chrono>
#include <vector>
#include <algorithm>
#include <numeric>
#include <thread>

std::pair<double, double> test_cpp_requests(const std::string &url, int iterations = 1000, int max_retries = 5)
{
CURL *curl;
CURLcode res;
curl = curl_easy_init();

std::vector<double> times;
if (curl)
{
for (int i = 0; i < iterations; i++)
{
bool success = false;
for (int attempt = 0; attempt < max_retries; attempt++)
{
auto start = std::chrono::high_resolution_clock::now();

curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
res = curl_easy_perform(curl);

auto end = std::chrono::high_resolution_clock::now();
std::chrono::duration<double> elapsed = end - start;

if (res == CURLE_OK)
{
times.push_back(elapsed.count());
success = true;
break;
}
else
{
std::cerr << "Attempt " << (attempt + 1) << " failed: " << curl_easy_strerror(res) << std::endl;
std::this_thread::sleep_for(std::chrono::seconds(1));
}
}

if (!success)
{
std::cerr << "Failed to connect after multiple attempts" << std::endl;
return {0.0, 0.0};
}
}
curl_easy_cleanup(curl);
}

double mean_time = std::accumulate(times.begin(), times.end(), 0.0) / times.size();
std::sort(times.begin(), times.end());
double p999_time = times[(int)(iterations * 0.999)];

return {mean_time, p999_time};
}

int main()
{
std::string url = "http://buttonwood.cn:8887/";
auto [mean_time, p999_time] = test_cpp_requests(url, 1000);
if (mean_time > 0)
{
std::cout << "C++ Requests - Mean: " << mean_time << " s, p999: " << p999_time << " s" << std::endl;
}
return 0;
}

```

Python+rust(pyo3)代码如下

```python
import fib_rust  # Assuming this is the Rust extension module
import time
import numpy as np  # Use NumPy to help with percentile calculation

# List to store the times for each request
times = []

url = "http://buttonwood.cn:8887"

# Run the request 1000 times
for i in range(1000):
while True:
start_time = time.time()  # Record the start time
try:
result = fib_rust.rust_get(url)  # Make the request
except Exception as e:
print(f"Request {i+1} failed: {e}")
continue  # Skip to the next iteration if there's an error

end_time = time.time()  # Record the end time
times.append(end_time - start_time)  # Append the elapsed time
print(f"Request {i+1} succeeded in {times[-1]:.6f} seconds")
break  


    
    # Calculate the average time
    average_time = np.mean(times)
    
# Calculate the 99.9th percentile (p999)
p999 = np.percentile(times, 99.9)
print(f"Python+rust(pyo3) Requests - Mean: {average_time:.6f} s, p999: {p999:.6f} s")

```

```rust
use pyo3::prelude::*;
use reqwest::{self};
use std::time::Duration;
use tokio::runtime::Runtime;

async fn rust_get_async(url: String) -> Result<String, reqwest::Error> {
let mut body = String::new();

for i in 1..5 {
let response = reqwest::get(&url).await;
match response {
Ok(resp) => {
body = resp.text().await.unwrap();  // Extract the response body
return Ok(body);
}
Err(e) => {
println!("Attempt {} failed: {}", i, e);
if i == 4 {
return Err(e);
}
tokio::time::sleep(Duration::from_secs(1)).await;  // Delay before retry
}
}
}

//nerver reach here
return Ok(body);
}


    
    /// Synchronous wrapper for the async function, exposed to Python
    #[pyfunction]
    fn rust_get(url: String) -> PyResult<String> {
        // Create a new Tokio runtime
        let rt = Runtime::new().unwrap();
    
// Run the async function and handle the result
match rt.block_on(rust_get_async(url)) {
Ok(body) => Ok(body),
Err(e) => Err(pyo3::exceptions::PyRuntimeError::new_err(e.to_string())),
}
}
/// A Python module implemented in Rust.
#[pymodule]
fn fib_rust(m: &Bound<'_, PyModule>) -> PyResult<()> {
m.add_function(wrap_pyfunction!(rust_get, m)?)?;
Ok(())
}

```

Python+c++(boost+curl等库) 

```c++
#include "pch.h"

#define BOOST_PYTHON_STATIC_LIB

//#define BUILDING_LIBCURL
#include <boost/python.hpp>
#include <iostream>
#include "curl/curl.h"
#include <chrono>
#include <vector>
#include <algorithm>
#include <numeric>
#include <thread>

struct boostRequest
{

    // 回调函数，将数据写入 string
    static size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* userp)
    {
        size_t totalSize = size * nmemb;
        userp->append((char*)contents, totalSize);
        return totalSize;
    }

    std::string myget(const std::string& url) {
        CURL* curl = curl_easy_init();;
        CURLcode res;
        
        if (!curl) {
            std::cerr << "Failed to initialize CURL" << std::endl;
            printf("init failed");
            return "error";
        }

        std::string readBuffer;

        for (int attempt = 0; attempt < 5; attempt++)
        {
            // 设置URL
            curl_easy_setopt(curl, CURLOPT_URL, url.c_str());

            // 设置回调函数，用于接收数据
            curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
            curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);

            // 执行请求
            res = curl_easy_perform(curl);

            if (res == CURLE_OK)
            {
                curl_easy_cleanup(curl);
                return readBuffer; // 成功时返回请求的内容
            }

            std::cerr << "Attempt " << (attempt + 1) << " failed: " << curl_easy_strerror(res) << std::endl;
            std::this_thread::sleep_for(std::chrono::seconds(1)); // 等待1秒再重试
        }

        std::cerr << "Failed to connect after multiple attempts" << std::endl;
        curl_easy_cleanup(curl);
        return "error"; // 多次尝试失败后返回错误
    }
};

BOOST_PYTHON_MODULE(python_boost_dll)
{
    //struct
    boost::python::class_<boostRequest>("boostRequest")
        .def("myget", &boostRequest::myget);
}

```
```python
import python_boost_dll
import time
import numpy as np  # Use NumPy to help with percentile calculation

# List to store the times for each request
times = []
ptr = python_boost_dll.boostRequest()
url = "http://buttonwood.cn:8887"
start_time = 0
end_time = 0
# Run the request 1000 times
for i in range(1000):
    success = 0
    while success == 0:
        start_time = time.time()  # Record the start time
        try:
            result = ptr.myget(url)  # Make the request
            end_time = time.time()  # Record the end time
            success = 1
        except Exception as e:print(f"Request {i+1} failed: {e}")
        times.append(end_time - start_time)  # Append the elapsed time
        print(f"Request {i+1} succeeded in {times[-1]:.6f} seconds")
    

# Calculate the average time
average_time = np.mean(times)

# Calculate the 99.9th percentile (p999)
p999 = np.percentile(times, 99.9)
print(f"Python + C++(boost) Requests - Mean: {average_time:.6f} s, p999: {p999:.6f} s")

```

#### 2. **多线程处理与异步支持测试**

```python
import requests
import time
import numpy as np
from concurrent.futures import ThreadPoolExecutor

def make_request(url):
    try:
        response = requests.get(url, timeout=5)
        return response.status_code
    except Exception as e:
        return str(e), None
url = "http://www.nongpin88.com/"
# url = "http://buttonwood.cn:8887/"
num_threads = 1000  # 设置线程数
success_num = 0  # 用于记录成功的请求数
failure_num = 0  # 用于记录失败的请求数
response_times = []  # 用于存储所有请求的时间

# 使用ThreadPoolExecutor创建线程池
with ThreadPoolExecutor(max_workers=num_threads) as executor:
    # 将请求任务提交给线程池
    start_time = time.time()
    # 获取结果
    while success_num < num_threads and failure_num < num_threads:

        future_to_url = {executor.submit(make_request, url): url for _ in range(num_threads-success_num)}
        for future in future_to_url:
            url = future_to_url[future]
            try:
                status_code = future.result()
                if status_code == 200:
                    success_num += 1
                    print(f"Success: {success_num}")
                else:
                    failure_num += 1
                    print(f"Failure: {failure_num}")
            except Exception as e:
                failure_num += 1
                print(f"URL: {url}, Error: {e}")

    end_time = time.time()
# 计算统计信息
mean_time = np.mean((end_time-start_time)/num_threads)
print(f"python Mutithread Mean Time - {mean_time:.6f} s")

```

py+rust

```rust
use pyo3::prelude::*;
use reqwest::{self};
use reqwest::Client;
use tokio::task;
use futures::future::join_all;
use std::time::Duration;
use std::sync::{Arc, Mutex};

#[tokio::main]
async fn rust_get_async(_url: String, totol_nums:i32) ->  Result<String, String>  {
    let client = Client::builder()
    .timeout(Duration::from_secs(5))  // 设置请求超时时间为5秒
    .build()
    .unwrap();

    // 使用 Arc<Mutex<>> 来确保 success 和 failed 能在线程间共享
    let success = Arc::new(Mutex::new(0));
    let failed = Arc::new(Mutex::new(0));

    while *success.lock().unwrap() < totol_nums && *failed.lock().unwrap() < totol_nums {
        let mut handles = vec![];

        // 创建多个异步任务
        let threads = totol_nums - *success.lock().unwrap();
        for _ in 0..threads {
            let client_clone = client.clone();
            let url_clone = _url.to_string(); //实际 URL

            // 克隆 Arc 以便在线程间共享
            let success_clone = Arc::clone(&success);
            let failed_clone = Arc::clone(&failed);

            // 使用 tokio::spawn 创建并发任务
            handles.push(task::spawn(async move {
                match client_clone.get(&url_clone).send().await {
                    Ok(response) => {
                        if response.status().is_success() {
                            let mut success = success_clone.lock().unwrap();
                            *success += 1;
                            println!("Request successful,{}", *success);
                        } else {
                            let mut failed = failed_clone.lock().unwrap();
                            *failed += 1;
                            println!("Request failed with status: {}", response.status());
                        }
                    }
                    Err(err) => {
                        let mut failed = failed_clone.lock().unwrap();
                        *failed += 1;
                        println!("Request error: {}", err);
                    }
                }
            }));
        }
        // 等待所有任务完成
        join_all(handles).await;
    }
    if *success.lock().unwrap() >= totol_nums {
        return Ok("ok".to_string());
    } else {
        return Err("Failed after many tries".to_string());
    }
}

/// Synchronous wrapper for the async function, exposed to Python
#[pyfunction]
fn rust_get(url: String, totol_nums:i32) -> PyResult<String> {
    // Run the async function and handle the result
    match rust_get_async(url, totol_nums) {
        Ok(body) => Ok(body),
        Err(e) => Err(pyo3::exceptions::PyRuntimeError::new_err(e)),
    }
}
/// A Python module implemented in Rust.
#[pymodule]
fn fib_rust(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(rust_get, m)?)?;
    Ok(())
}

```

```python
import fib_rust  # Assuming this is the Rust extension module
import time
import numpy as np  # Use NumPy to help with percentile calculation

# List to store the times for each request
times = 1000

url="http://www.nongpin88.com/"

start_time = time.time()  # Record the start time
result = fib_rust.rust_get(url, times)  # Make the request
end_time = time.time()  # Record the end time

# Calculate the average time
average_time = (end_time - start_time)/   times
print(f"Python+rust(pyo3) Requests - Mean: {average_time:.6f} s")

```

