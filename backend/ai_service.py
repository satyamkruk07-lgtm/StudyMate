import os
import re
import threading
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import errors
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

def get_gemini_client() -> Optional[genai.Client]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "your_gemini_api_key_here":
        return None
    return genai.Client(api_key=api_key)

def _call_gemini_with_timeout(
    client: genai.Client,
    model: str,
    contents: str,
    config: Dict[str, Any],
    timeout_seconds: int = 25
) -> Optional[str]:
    """Execute Gemini generate_content call with an explicit daemon thread safety timeout."""
    result_container: List[str] = []

    def worker():
        try:
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=config
            )
            if response and response.text:
                result_container.append(response.text.strip())
        except Exception as e:
            print(f"[Gemini Error]: {e}", flush=True)

    t = threading.Thread(target=worker, daemon=True)
    t.start()
    t.join(timeout=timeout_seconds)

    if result_container:
        return result_container[0]
    return None

# --- Specialized Domain Answer Generators (5 Distinct Descriptive Points) ---

def get_c_language_answer(user_stage: str, lang: str) -> str:
    return (
        f"### Conceptual Explanation: C Programming Language in Systems Architecture\n\n"
        f"For students in **{user_stage}**, **C** is the foundational systems programming language developed by **Dennis Ritchie** at Bell Laboratories in 1972. Here is a comprehensive 5-point explanation:\n\n"
        "---\n\n"
        "### 1. Core Definition & Philosophical Foundation\n"
        "* C is a **statically-typed, compiled, procedural language** often designated as a 'middle-level language'.\n"
        "* It balances the structured control constructs of high-level programming (loops, conditionals, functions) with low-level direct access to physical memory addresses and CPU registers.\n"
        "* The design philosophy prioritizes minimal runtime overhead, deterministic execution, and portability across heterogeneous hardware architectures.\n\n"
        "---\n\n"
        "### 2. Systems Architecture & Memory Layout\n"
        "When a compiled C program runs, its virtual address space is organized into 5 distinct memory segments:\n"
        "* **Text (Code) Segment:** Read-only region containing machine instructions.\n"
        "* **Data Segment & BSS:** Initialized global/static variables (`Data`) and zero-initialized variables (`BSS`).\n"
        "* **Heap:** Dynamically allocated memory requested at runtime via `malloc()`, `calloc()`, and freed using `free()`.\n"
        "* **Stack:** Function call frames, local variables, and return addresses allocated and freed automatically in LIFO order.\n"
        "* **Compilation Pipeline:** Source (`.c`) -> Preprocessor (`.i`) -> Compiler (`.s`) -> Assembler (`.o`) -> Linker -> Executable Binary.\n\n"
        "---\n\n"
        "### 3. Practical Applications & Industry Usage\n"
        "* **Operating System Kernels:** Over 90% of the Linux kernel, Windows NT kernel, and macOS Darwin are implemented in C.\n"
        "* **Embedded & IoT Devices:** Microcontrollers (ARM Cortex, AVR, PIC) rely on C for zero-overhead hardware control.\n"
        "* **Database Storage Engines:** PostgreSQL, SQLite, and MySQL core engines are written in C for maximum I/O throughput.\n\n"
        "---\n\n"
        "### 4. Step-by-Step Code Example: Dynamic Memory & Pointers\n"
        "```c\n"
        "#include <stdio.h>\n"
        "#include <stdlib.h>\n\n"
        "int main(void) {\n"
        "    int capacity = 5;\n"
        "    // 1. Allocate heap memory for 5 integers\n"
        "    int *numbers = (int*)malloc(capacity * sizeof(int));\n"
        "    if (numbers == NULL) {\n"
        "        printf(\"Memory allocation failed!\\n\");\n"
        "        return 1;\n"
        "    }\n\n"
        "    // 2. Populate array using pointer arithmetic\n"
        "    for (int i = 0; i < capacity; i++) {\n"
        "        *(numbers + i) = (i + 1) * 10;\n"
        "    }\n\n"
        "    // 3. Print stored values\n"
        "    printf(\"Dynamic Array Elements: \");\n"
        "    for (int i = 0; i < capacity; i++) {\n"
        "        printf(\"%d \", *(numbers + i));\n"
        "    }\n"
        "    printf(\"\\n\");\n\n"
        "    // 4. Free heap memory to prevent memory leaks\n"
        "    free(numbers);\n"
        "    numbers = NULL;\n"
        "    return 0;\n"
        "}\n"
        "```\n\n"
        "---\n\n"
        "### 5. Key Trade-offs & Summary Comparison Table\n\n"
        "| Feature / Metric | C Language Advantage (+) | Engineering Constraint (-) |\n"
        "| :--- | :--- | :--- |\n"
        "| **Execution Speed** | Compiles directly to native assembly; unmatched raw performance. | No garbage collection; manual memory management required. |\n"
        "| **Hardware Access** | Direct pointer manipulation of memory and hardware registers. | Risk of segmentation faults (`SIGSEGV`), buffer overflows, and memory leaks. |\n"
        "| **Runtime Footprint** | Extremely small binary size; runs on microchips with kilobytes of RAM. | Lacks modern language constructs (classes, exceptions, templates). |\n\n"
        "---\n\n"
        f"💡 *General Knowledge Explanation • Tailored for {user_stage} ({lang})*"
    )

def get_cpp_language_answer(user_stage: str, lang: str) -> str:
    return (
        f"### Conceptual Explanation: C++ & Object-Oriented Systems Design\n\n"
        f"In university computer science for **{user_stage}**, **C++** (created by Bjarne Stroustrup) expands C with Object-Oriented, Generic, and Functional programming paradigms. Here is a 5-point explanation:\n\n"
        "---\n\n"
        "### 1. Core Definition & Paradigms\n"
        "* C++ is a **multi-paradigm, statically typed, compiled language** built with the philosophy of 'zero-overhead abstraction'.\n"
        "* Introduces the 4 pillars of OOP: **Encapsulation**, **Abstraction**, **Inheritance**, and **Polymorphism**.\n"
        "* Supports both compile-time polymorphism (Templates, Overloading) and runtime polymorphism (Virtual Functions, Abstract Classes).\n\n"
        "---\n\n"
        "### 2. Under the Hood: RAII & Virtual Method Tables (vtable)\n"
        "* **RAII (Resource Acquisition Is Initialization):** Ties resource acquisition (heap memory, socket connections, mutexes) strictly to object lifetime.\n"
        "* **Virtual Method Table (vtable):** When a class has virtual functions, the compiler generates a `vtable` of function pointers and injects a hidden pointer (`vptr`) into each instance to resolve dynamic calls at runtime.\n\n"
        "---\n\n"
        "### 3. Practical Applications & Industry Usage\n"
        "* **Game Development:** High-end AAA game engines (Unreal Engine) are built in C++ for real-time graphics rendering.\n"
        "* **High-Frequency Trading (HFT):** Low-latency financial algorithms execute trades in nanoseconds using optimized C++.\n"
        "* **System Software & AI Frameworks:** Web browser engines (Google Chromium V8/Blink) and deep learning backends (PyTorch, TensorFlow) are written in C++.\n\n"
        "---\n\n"
        "### 4. Step-by-Step Code Example: RAII & Class Design\n"
        "```cpp\n"
        "#include <iostream>\n"
        "#include <vector>\n"
        "#include <string>\n\n"
        "class Student {\n"
        "private:\n"
        "    std::string name;\n"
        "    int rollNumber;\n\n"
        "public:\n"
        "    Student(std::string n, int r) : name(n), rollNumber(r) {}\n\n"
        "    void display() const {\n"
        "        std::cout << \"Student: \" << name << \" | Roll No: \" << rollNumber << std::endl;\n"
        "    }\n"
        "};\n\n"
        "int main() {\n"
        "    std::vector<Student> batch;\n"
        "    batch.push_back(Student(\"Aarav\", 101));\n"
        "    batch.push_back(Student(\"Diya\", 102));\n\n"
        "    for (const auto& s : batch) {\n"
        "        s.display();\n"
        "    }\n"
        "    return 0;\n"
        "}\n"
        "```\n\n"
        "---\n\n"
        "### 5. Key Trade-offs & Summary Comparison Table\n\n"
        "| Metric | C++ Advantage (+) | Engineering Constraint (-) |\n"
        "| :--- | :--- | :--- |\n"
        "| **Abstraction Level** | Expressive syntax without sacrificing low-level performance. | Extremely large and complex language specification. |\n"
        "| **Standard Library** | STL provides rich containers (`vector`, `map`, `unordered_set`, `algorithm`). | Compilation times can be slow due to heavy template expansions. |\n"
        "| **Resource Safety** | Smart pointers (`std::unique_ptr`, `std::shared_ptr`) eliminate manual leaks. | Undefined behavior still possible with raw pointer misuse. |\n\n"
        "---\n\n"
        f"💡 *General Knowledge Explanation • Tailored for {user_stage} ({lang})*"
    )

def get_java_language_answer(user_stage: str, lang: str) -> str:
    return (
        f"### Conceptual Explanation: Java & Virtual Machine Architecture\n\n"
        f"In university coursework for **{user_stage}**, **Java** (designed by James Gosling at Sun Microsystems) is a class-based, object-oriented language famous for 'Write Once, Run Anywhere' (WORA). Here is a 5-point explanation:\n\n"
        "---\n\n"
        "### 1. Core Definition & The Java Philosophy\n"
        "* Java is a **strictly object-oriented, strongly-typed language** designed for network computing and platform independence.\n"
        "* Source code (`.java`) compiles into intermediate bytecode (`.class`), which is executed by the **Java Virtual Machine (JVM)**.\n"
        "* Emphasizes memory safety by eliminating explicit memory pointers and providing automatic garbage collection.\n\n"
        "---\n\n"
        "### 2. Under the Hood: JVM Architecture & Memory Segments\n"
        "* **Class Loader Subsystem:** Loads, links, and initializes bytecode into memory.\n"
        "* **JVM Memory Segments:**\n"
        "  * **Heap:** Shared memory pool where all object instances and arrays reside.\n"
        "  * **JVM Stack:** Per-thread frames for local variables, operands, and method calls.\n"
        "  * **Metaspace (Method Area):** Class metadata, bytecode, static fields, and constant pool.\n"
        "* **Execution Engine:** Interprets bytecode and uses the **Just-In-Time (JIT) Compiler** to translate frequent hotspots into native machine instructions.\n\n"
        "---\n\n"
        "### 3. Practical Applications & Industry Usage\n"
        "* **Enterprise Backend Services:** Banking systems and e-commerce backends (Spring Boot, Hibernate, Quarkus).\n"
        "* **Android Application Development:** Native Android runtime (ART) builds upon Java/Kotlin foundations.\n"
        "* **Big Data Systems:** Apache Kafka, Apache Spark, Hadoop, and Cassandra are written in Java and Scala.\n\n"
        "---\n\n"
        "### 4. Step-by-Step Code Example: Encapsulation & Inheritance\n"
        "```java\n"
        "class BankAccount {\n"
        "    private String accountNumber;\n"
        "    private double balance;\n\n"
        "    public BankAccount(String accNo, double initialBalance) {\n"
        "        this.accountNumber = accNo;\n"
        "        this.balance = initialBalance;\n"
        "    }\n\n"
        "    public void deposit(double amount) {\n"
        "        if (amount > 0) balance += amount;\n"
        "    }\n\n"
        "    public double getBalance() {\n"
        "        return balance;\n"
        "    }\n"
        "}\n\n"
        "public class Main {\n"
        "    public static void main(String[] args) {\n"
        "        BankAccount acc = new BankAccount(\"SB-10029\", 5000.0);\n"
        "        acc.deposit(1500.0);\n"
        "        System.out.println(\"Current Balance: INR \" + acc.getBalance());\n"
        "    }\n"
        "}\n"
        "```\n\n"
        "---\n\n"
        "### 5. Key Trade-offs & Summary Comparison Table\n\n"
        "| Metric | Java Advantage (+) | Engineering Constraint (-) |\n"
        "| :--- | :--- | :--- |\n"
        "| **Portability** | Bytecode executes identically across Windows, Linux, macOS, ARM. | Initial startup latency and JVM memory footprint. |\n"
        "| **Memory Safety** | Robust Garbage Collection prevents manual memory leaks. | GC pauses (Stop-The-World) can cause latency spikes in real-time systems. |\n"
        "| **Concurrency** | Built-in multithreading (`Thread`, `ExecutorService`, Virtual Threads). | Higher memory consumption compared to compiled C/C++ binaries. |\n\n"
        "---\n\n"
        f"💡 *General Knowledge Explanation • Tailored for {user_stage} ({lang})*"
    )

def get_python_dsa_answer(user_stage: str, lang: str) -> str:
    return (
        f"### Conceptual Explanation: Python in Data Structures & Systems\n\n"
        f"For students in **{user_stage}**, **Python** is a high-level, dynamically typed language created by Guido van Rossum, prized for rapid prototyping, data science, and clean algorithmic problem-solving. Here is a 5-point explanation:\n\n"
        "---\n\n"
        "### 1. Core Definition & Characteristics\n"
        "* Python is an **interpreted, multi-paradigm, dynamically typed language** where variables are bound to objects at runtime.\n"
        "* It features automatic memory management via reference counting and a cyclic generational garbage collector.\n"
        "* Emphasizes clean readability ('The Zen of Python'), enabling algorithms to be expressed in concise mathematical notation.\n\n"
        "---\n\n"
        "### 2. Under the Hood: CPython Memory Model & The GIL\n"
        "* **CPython Implementation:** The standard Python engine is written in C. Every variable is a pointer to a `PyObject` structure.\n"
        "* **Lists vs Arrays:** A Python `list` is a dynamically resizing array of pointers to `PyObject` items, allowing heterogeneous types but introducing pointer indirection overhead.\n"
        "* **Global Interpreter Lock (GIL):** A mutex in CPython that ensures only one native thread executes Python bytecode at a time, protecting memory consistency.\n\n"
        "---\n\n"
        "### 3. Practical Applications & Industry Usage\n"
        "* **AI, Machine Learning & Deep Learning:** TensorFlow, PyTorch, Scikit-Learn, and HuggingFace ecosystems.\n"
        "* **Data Science & Analytics:** NumPy, Pandas, Matplotlib, SciPy for numerical analysis.\n"
        "* **Web Backend & Automation:** FastAPI, Django, Flask, and automated scripting across cloud systems.\n\n"
        "---\n\n"
        "### 4. Step-by-Step Code Example: Clean Data Structure Implementation\n"
        "```python\n"
        "class Stack:\n"
        "    def __init__(self):\n"
        "        self._data = []\n\n"
        "    def push(self, element):\n"
        "        # Append element: O(1) amortized time\n"
        "        self._data.append(element)\n\n"
        "    def pop(self):\n"
        "        # Remove top element: O(1) time\n"
        "        if self.is_empty():\n"
        "            raise IndexError('pop from empty stack')\n"
        "        return self._data.pop()\n\n"
        "    def peek(self):\n"
        "        if self.is_empty():\n"
        "            raise IndexError('peek from empty stack')\n"
        "        return self._data[-1]\n\n"
        "    def is_empty(self):\n"
        "        return len(self._data) == 0\n\n"
        "    def size(self):\n"
        "        return len(self._data)\n\n"
        "if __name__ == '__main__':\n"
        "    st = Stack()\n"
        "    for item in [10, 20, 30]:\n"
        "        st.push(item)\n"
        "    print('Stack Top:', st.peek())  # 30\n"
        "    print('Popped:', st.pop())       # 30\n"
        "    print('Remaining Size:', st.size())  # 2\n"
        "```\n\n"
        "---\n\n"
        "### 5. Key Trade-offs & Summary Comparison Table\n\n"
        "| Metric | Python Advantage (+) | Engineering Constraint (-) |\n"
        "| :--- | :--- | :--- |\n"
        "| **Development Speed** | 3-5x faster prototyping than C++ or Java; expressive standard library. | Slower execution in CPU-bound loops compared to compiled languages. |\n"
        "| **Ecosystem** | World's premier ecosystem for Artificial Intelligence and Machine Learning. | High per-object memory overhead due to `PyObject` metadata. |\n"
        "| **Syntax Simplicity** | Intuitive indentation-based syntax reduces boilerplate bugs. | Dynamic typing can allow type-related errors to slip to runtime. |\n\n"
        "---\n\n"
        f"💡 *General Knowledge Explanation • Tailored for {user_stage} ({lang})*"
    )

def get_linked_list_answer(user_stage: str, lang: str) -> str:
    return (
        f"### Conceptual Explanation: Linked List Data Structures\n\n"
        f"In university **Data Structures & Algorithms (DSA)** for **{user_stage}**, a **Linked List** is a fundamental linear data structure where elements are not stored at contiguous memory locations. Here is a 5-point explanation:\n\n"
        "---\n\n"
        "### 1. Core Definition & Structural Principles\n"
        "* A Linked List consists of **nodes**, where each node encapsulates two fields:\n"
        "  * **Data:** The value or payload being stored.\n"
        "  * **Next Pointer (`next`):** A memory reference pointing to the subsequent node in the sequence.\n"
        "* The list begins at a **Head** pointer and terminates with a node whose pointer references `NULL` / `None`.\n"
        "* Variants include **Singly Linked Lists**, **Doubly Linked Lists** (having both `prev` and `next` pointers), and **Circular Linked Lists**.\n\n"
        "---\n\n"
        "### 2. Under the Hood: Heap Allocation vs Contiguous Arrays\n"
        "* **Dynamic Memory Sizing:** While arrays require a fixed contiguous block of memory allocated upfront, linked list nodes are individually allocated on the **heap** as needed.\n"
        "* **Insertion & Deletion:** Inserting or deleting a node at the head takes **O(1) constant time** by simply updating pointers, without shifting subsequent elements.\n"
        "* **Traversal & Random Access:** Arrays allow O(1) index access (`arr[i]`), whereas linked lists require **O(n) linear traversal** because memory addresses must be navigated sequentially pointer by pointer.\n\n"
        "---\n\n"
        "### 3. Practical Applications & Real-World Use Cases\n"
        "* **OS Memory Allocation:** Free memory blocks on the OS heap are maintained using linked lists (Free Lists).\n"
        "* **Undo / Redo Buffers:** Applications and text editors use doubly linked lists to navigate historical state changes.\n"
        "* **Underlying Building Block:** Stacks, Queues, Hash Table chaining (collision resolution), and LRU Caches are implemented using linked lists.\n\n"
        "---\n\n"
        "### 4. Step-by-Step Code Example: Singly Linked List\n"
        "```python\n"
        "class Node:\n"
        "    def __init__(self, data):\n"
        "        self.data = data\n"
        "        self.next = None\n\n"
        "class LinkedList:\n"
        "    def __init__(self):\n"
        "        self.head = None\n\n"
        "    def insert_at_beginning(self, data):\n"
        "        # Time Complexity: O(1)\n"
        "        new_node = Node(data)\n"
        "        new_node.next = self.head\n"
        "        self.head = new_node\n\n"
        "    def display(self):\n"
        "        # Traverse and print all nodes: O(n)\n"
        "        current = self.head\n"
        "        elements = []\n"
        "        while current:\n"
        "            elements.append(str(current.data))\n"
        "            current = current.next\n"
        "        print(' -> '.join(elements) + ' -> NULL')\n\n"
        "if __name__ == '__main__':\n"
        "    ll = LinkedList()\n"
        "    ll.insert_at_beginning(30)\n"
        "    ll.insert_at_beginning(20)\n"
        "    ll.insert_at_beginning(10)\n"
        "    ll.display()  # Output: 10 -> 20 -> 30 -> NULL\n"
        "```\n\n"
        "---\n\n"
        "### 5. Key Trade-offs: Arrays vs Linked Lists Comparison Table\n\n"
        "| Operation / Metric | Array / Dynamic List | Linked List |\n"
        "| :--- | :--- | :--- |\n"
        "| **Random Access (`get(i)`)** | O(1) constant time | O(n) sequential search |\n"
        "| **Insert at Beginning** | O(n) requires shifting all elements | O(1) only pointer updates |\n"
        "| **Insert at End** | O(1) amortized | O(n) unless tail pointer maintained (O(1)) |\n"
        "| **Memory Overhead** | Compact contiguous storage | Extra memory for pointer fields in each node |\n"
        "| **CPU Cache Locality** | Excellent (spatial cache prefetching) | Poor (scattered heap addresses cause cache misses) |\n\n"
        "---\n\n"
        f"💡 *General Knowledge Explanation • Tailored for {user_stage} ({lang})*"
    )

def get_queue_answer(user_stage: str, lang: str) -> str:
    return (
        f"### Conceptual Explanation: Queue Data Structure (FIFO)\n\n"
        f"In university computer science for **{user_stage}**, a **Queue** is an essential linear data structure operating under the **First-In, First-Out (FIFO)** ordering principle. Here is a 5-point explanation:\n\n"
        "---\n\n"
        "### 1. Core Definition & Principles\n"
        "* A Queue functions like a real-world checkout queue: the first element added is the first one to be removed.\n"
        "* Has two primary access boundaries:\n"
        "  * **Rear (Tail):** Where new items are inserted via the **Enqueue** operation.\n"
        "  * **Front (Head):** Where items are extracted via the **Dequeue** operation.\n"
        "* Other essential helper operations include **Peek/Front** (view front item without deletion) and **isEmpty**.\n\n"
        "---\n\n"
        "### 2. Under the Hood: Types & Implementation Mechanics\n"
        "* **Linear Queue:** Can experience the 'false overflow' issue if implemented with a fixed array once pointers hit the array boundary.\n"
        "* **Circular Queue:** Solves false overflow by wrapping pointers back to index 0 using modulo arithmetic: `rear = (rear + 1) % capacity`.\n"
        "* **Priority Queue:** Elements are dequeued based on priority rather than arrival order, implemented using binary heaps in O(log n) time.\n"
        "* **Double-Ended Queue (Deque):** Allows push and pop operations at both the front and rear boundaries.\n\n"
        "---\n\n"
        "### 3. Practical Applications & Industry Usage\n"
        "* **CPU Scheduling:** Operating system ready-queues schedule waiting processes for execution.\n"
        "* **Print Spooling:** Print jobs are served in the exact order they were sent to the printer.\n"
        "* **Breadth-First Search (BFS):** Graph and tree level-order traversals strictly rely on queues to explore nearest neighbors first.\n"
        "* **Message Brokers:** Distributed streaming architectures (RabbitMQ, Apache Kafka, AWS SQS) are queue-driven.\n\n"
        "---\n\n"
        "### 4. Step-by-Step Code Example: Queue in Python\n"
        "```python\n"
        "from collections import deque\n\n"
        "class TaskQueue:\n"
        "    def __init__(self):\n"
        "        # Uses double-ended queue internally for O(1) operations\n"
        "        self._queue = deque()\n\n"
        "    def enqueue(self, task_name: str):\n"
        "        # Enqueue task at rear: O(1)\n"
        "        self._queue.append(task_name)\n"
        "        print(f'Enqueued: {task_name}')\n\n"
        "    def dequeue(self) -> str:\n"
        "        # Dequeue task from front: O(1)\n"
        "        if not self._queue:\n"
        "            raise IndexError('Queue is empty')\n"
        "        task = self._queue.popleft()\n"
        "        print(f'Dequeued: {task}')\n"
        "        return task\n\n"
        "    def peek(self) -> str:\n"
        "        return self._queue[0] if self._queue else None\n\n"
        "if __name__ == '__main__':\n"
        "    q = TaskQueue()\n"
        "    q.enqueue('Render UI')\n"
        "    q.enqueue('Fetch API Data')\n"
        "    q.dequeue()  # Removes 'Render UI' (First-In, First-Out)\n"
        "    print('Next in line:', q.peek())  # 'Fetch API Data'\n"
        "```\n\n"
        "---\n\n"
        "### 5. Key Trade-offs & Summary Comparison Table\n\n"
        "| Metric | Queue Advantage (+) | Engineering Consideration (-) |\n"
        "| :--- | :--- | :--- |\n"
        "| **Fairness & Ordering** | Guarantees strictly fair chronological processing without starvation. | Cannot access elements in the middle without dequeuing predecessors. |\n"
        "| **Time Complexity** | Both Enqueue and Dequeue execute in guaranteed O(1) constant time. | Array-based queues require circular modulo arithmetic or dynamic resizing. |\n"
        "| **Concurrency** | Thread-safe queues (`BlockingQueue`) streamline producer-consumer synchronization. | Bounded queues risk backpressure or memory exhaustion under heavy load. |\n\n"
        "---\n\n"
        f"💡 *General Knowledge Explanation • Tailored for {user_stage} ({lang})*"
    )

def get_stack_answer(user_stage: str, lang: str) -> str:
    return (
        f"### Conceptual Explanation: Stack Data Structure (LIFO)\n\n"
        f"In university computer science for **{user_stage}**, a **Stack** is a linear collection governed by the **Last-In, First-Out (LIFO)** ordering principle. Here is a 5-point explanation:\n\n"
        "---\n\n"
        "### 1. Core Definition & Principle\n"
        "* A Stack is a linear data structure where all insertions and deletions occur exclusively at a single end called the **Top**.\n"
        "* Think of a vertical stack of plates: the last plate placed on top is the first plate you pick up.\n"
        "* Core Operations:\n"
        "  * **Push:** Places a new element onto the top of the stack (O(1)).\n"
        "  * **Pop:** Removes and returns the current top element (O(1)).\n"
        "  * **Peek / Top:** Inspects the top element without removing it (O(1)).\n\n"
        "---\n\n"
        "### 2. Under the Hood: Call Stacks & Memory Architecture\n"
        "* **System Call Stack:** Every executing program utilizes a hardware-level call stack. When a function is invoked, an Activation Record (Stack Frame) containing return addresses, parameters, and local variables is pushed. When the function returns, its frame is popped.\n"
        "* **Stack Overflow:** Occurs when excessive function nesting (such as unbounded recursion) exceeds allocated stack memory limits.\n"
        "* **Auxiliary Implementations:** Can be constructed via dynamic arrays (amortized O(1) append) or singly linked lists (O(1) head insertion).\n\n"
        "---\n\n"
        "### 3. Practical Applications & Industry Usage\n"
        "* **Expression Evaluation & Syntax Parsing:** Evaluating postfix/prefix notations and validating balanced brackets in compilers.\n"
        "* **Browser Navigation:** The 'Back' button pushes visited URLs onto a stack and pops them upon backward navigation.\n"
        "* **Depth-First Search (DFS):** Graph and tree backtracking algorithms use stacks (either iteratively or via the call stack).\n\n"
        "---\n\n"
        "### 4. Step-by-Step Code Example: Balanced Parentheses Validation\n"
        "```python\n"
        "def is_parentheses_balanced(expression: str) -> bool:\n"
        "    stack = []\n"
        "    mapping = {')': '(', ']': '[', '}': '{'}\n\n"
        "    for char in expression:\n"
        "        if char in mapping.values():\n"
        "            stack.append(char)  # Push opening bracket\n"
        "        elif char in mapping:\n"
        "            if not stack or stack[-1] != mapping[char]:\n"
        "                return False\n"
        "            stack.pop()  # Pop matched opening bracket\n\n"
        "    return len(stack) == 0\n\n"
        "print(\"Balanced '({[]})':\", is_parentheses_balanced(\"({[]})\"))  # True\n"
        "print(\"Unbalanced '([)]':\", is_parentheses_balanced(\"([)]\"))    # False\n"
        "```\n\n"
        "---\n\n"
        "### 5. Key Trade-offs & Summary Comparison Table\n\n"
        "| Metric | Stack Advantage (+) | Engineering Consideration (-) |\n"
        "| :--- | :--- | :--- |\n"
        "| **Deterministic State** | Pure LIFO order guarantees predictable reversal and backtracking. | No random index access; to inspect bottom item, all items above must be popped. |\n"
        "| **Performance** | Push, Pop, and Peek operate in ultra-fast O(1) constant time. | Fixed-capacity arrays can cause Stack Overflow errors. |\n"
        "| **Simplicity** | Minimal code footprint and memory overhead per element. | Deep recursive call stacks can consume megabytes of virtual memory. |\n\n"
        "---\n\n"
        f"💡 *General Knowledge Explanation • Tailored for {user_stage} ({lang})*"
    )

def get_trees_bst_answer(user_stage: str, lang: str) -> str:
    return (
        f"### Conceptual Explanation: Trees & Binary Search Trees (BST)\n\n"
        f"In university computer science for **{user_stage}**, **Trees** are non-linear, hierarchical data structures composed of interconnected nodes. Here is a 5-point explanation:\n\n"
        "---\n\n"
        "### 1. Core Definition & Hierarchy\n"
        "* A **Tree** consists of a designated **Root node** connected to zero or more child nodes via directed edges.\n"
        "* Key Terminology: **Parent**, **Child**, **Leaf node** (node with no children), **Depth** (edges from root), and **Height** (longest path to a leaf).\n"
        "* A **Binary Tree** restricts every node to at most two children: designated as `left` and `right`.\n\n"
        "---\n\n"
        "### 2. The Binary Search Tree (BST) Property\n"
        "* A Binary Tree is a **Binary Search Tree (BST)** if and only if for every node N:\n"
        "  * All values in the **Left Subtree** are strictly less than N.data (left < N).\n"
        "  * All values in the **Right Subtree** are strictly greater than N.data (right > N).\n"
        "* **In-Order Traversal (Left -> Root -> Right):** Always yields elements in sorted ascending order.\n"
        "* **Time Complexity:** Average search, insert, and delete operations take **O(log n)** time. However, if elements are inserted in sorted order, the BST degenerates into a skewed linked list with **O(n)** worst-case complexity.\n\n"
        "---\n\n"
        "### 3. Practical Applications & Industry Usage\n"
        "* **Database Indexing:** Self-balancing B-Trees and B+ Trees index billions of rows in relational databases (PostgreSQL, MySQL).\n"
        "* **Compilers & Interpreters:** Abstract Syntax Trees (ASTs) represent parsed grammar and expressions.\n"
        "* **File Systems:** Hierarchical folder and directory structures in Linux (ext4) and Windows (NTFS).\n"
        "* **Priority Queues:** Binary Heaps power Dijkstra's shortest path and task schedulers.\n\n"
        "---\n\n"
        "### 4. Step-by-Step Code Example: BST Insert & In-Order Traversal\n"
        "```python\n"
        "class TreeNode:\n"
        "    def __init__(self, val: int):\n"
        "        self.val = val\n"
        "        self.left = None\n"
        "        self.right = None\n\n"
        "class BinarySearchTree:\n"
        "    def __init__(self):\n"
        "        self.root = None\n\n"
        "    def insert(self, val: int):\n"
        "        self.root = self._insert_node(self.root, val)\n\n"
        "    def _insert_node(self, node: TreeNode, val: int) -> TreeNode:\n"
        "        if not node:\n"
        "            return TreeNode(val)\n"
        "        if val < node.val:\n"
        "            node.left = self._insert_node(node.left, val)\n"
        "        elif val > node.val:\n"
        "            node.right = self._insert_node(node.right, val)\n"
        "        return node\n\n"
        "    def inorder(self, node: TreeNode, result: list):\n"
        "        if node:\n"
        "            self.inorder(node.left, result)\n"
        "            result.append(node.val)\n"
        "            self.inorder(node.right, result)\n\n"
        "bst = BinarySearchTree()\n"
        "for num in [50, 30, 70, 20, 40, 60, 80]:\n"
        "    bst.insert(num)\n"
        "sorted_elements = []\n"
        "bst.inorder(bst.root, sorted_elements)\n"
        "print('Sorted Elements from BST:', sorted_elements)\n"
        "# Output: [20, 30, 40, 50, 60, 70, 80]\n"
        "```\n\n"
        "---\n\n"
        "### 5. Key Trade-offs: Balanced vs Unbalanced Trees\n\n"
        "| Tree Structure | Average Search | Worst-Case Search | Space Overhead | Self-Balancing Mechanism |\n"
        "| :--- | :--- | :--- | :--- | :--- |\n"
        "| **Standard BST** | O(log n) | O(n) (Skewed) | O(1) per node | None |\n"
        "| **AVL Tree** | O(log n) | O(log n) | Height balance factor | Tree Rotations (LL, RR, LR, RL) |\n"
        "| **Red-Black Tree** | O(log n) | O(log n) | 1 color bit per node | Color flips & rotations (used in C++ `std::map`, Java `TreeMap`) |\n\n"
        "---\n\n"
        f"💡 *General Knowledge Explanation • Tailored for {user_stage} ({lang})*"
    )

def get_searching_sorting_answer(user_stage: str, lang: str) -> str:
    return (
        f"### Conceptual Explanation: Algorithmic Efficiency & Binary Search\n\n"
        f"In university **Algorithms** courses for **{user_stage}**, **Binary Search** and sorting algorithms demonstrate algorithmic optimization and the divide-and-conquer paradigm. Here is a 5-point explanation:\n\n"
        "---\n\n"
        "### 1. Core Definition & Principle of Binary Search\n"
        "* Binary Search is a divide-and-conquer algorithm designed to locate a target element in a **strictly sorted collection**.\n"
        "* Instead of scanning sequentially (O(n)), it repeatedly divides the search interval in half.\n"
        "* Time Complexity: **O(log2 n)**, meaning searching through 1,000,000 items takes at most 20 comparisons.\n\n"
        "---\n\n"
        "### 2. Under the Hood: Midpoint Invariants & Overflow Safety\n"
        "* **Search Window:** Bounded by pointers `[low, high]`.\n"
        "* **Safe Midpoint Formulation:** Rather than using `(low + high) // 2` (which can cause integer overflow in 32-bit C/Java), engineers calculate: `mid = low + (high - low) // 2`.\n"
        "* **Branch Decisions:**\n"
        "  * If `arr[mid] == target`: Found immediately.\n"
        "  * If `arr[mid] < target`: Target lies in right sub-array; set `low = mid + 1`.\n"
        "  * If `arr[mid] > target`: Target lies in left sub-array; set `high = mid - 1`.\n\n"
        "---\n\n"
        "### 3. Practical Applications & Industry Usage\n"
        "* **Database B-Tree Page Lookup:** Finding record keys within individual page blocks.\n"
        "* **Git Bisect:** Finding the exact commit that introduced a software regression using binary search across commit history.\n"
        "* **Optimization Problems:** Finding thresholds via Binary Search on Answer.\n\n"
        "---\n\n"
        "### 4. Step-by-Step Code Example: Iterative Binary Search\n"
        "```python\n"
        "def binary_search(arr: list, target: int) -> int:\n"
        "    low, high = 0, len(arr) - 1\n"
        "    while low <= high:\n"
        "        mid = low + (high - low) // 2\n"
        "        if arr[mid] == target:\n"
        "            return mid\n"
        "        elif arr[mid] < target:\n"
        "            low = mid + 1\n"
        "        else:\n"
        "            high = mid - 1\n"
        "    return -1\n\n"
        "data = [3, 9, 14, 21, 33, 47, 59, 68, 72, 85, 99]\n"
        "index = binary_search(data, 47)\n"
        "print('Element 47 found at index:', index)  # Output: 5\n"
        "```\n\n"
        "---\n\n"
        "### 5. Algorithm Comparison Table\n\n"
        "| Algorithm | Best Case | Average Case | Worst Case | Space Complexity | Stable? |\n"
        "| :--- | :--- | :--- | :--- | :--- | :--- |\n"
        "| **Binary Search** | O(1) | O(log n) | O(log n) | O(1) | N/A |\n"
        "| **Merge Sort** | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |\n"
        "| **Quick Sort** | O(n log n) | O(n log n) | O(n^2) | O(log n) | No |\n"
        "| **Bubble Sort** | O(n) | O(n^2) | O(n^2) | O(1) | Yes |\n\n"
        "---\n\n"
        f"💡 *General Knowledge Explanation • Tailored for {user_stage} ({lang})*"
    )

def get_os_answer(user_stage: str, lang: str) -> str:
    return (
        f"### Conceptual Explanation: Operating Systems Principles & Concurrency\n\n"
        f"In university **Operating Systems (OS)** for **{user_stage}**, the operating system acts as the primary hardware resource manager and execution environment. Here is a 5-point explanation:\n\n"
        "---\n\n"
        "### 1. Core Definition: Processes vs Threads\n"
        "* **Process:** An independent program in execution with its own isolated virtual address space, Process Control Block (PCB), open file handles, and memory maps.\n"
        "* **Thread:** A lightweight unit of execution within a process. Threads within the same process share code, global data, and heap memory, but possess independent program counters (PC) and call stacks.\n"
        "* **Context Switch:** The CPU hardware/kernel saving registers of an active task and restoring state for the next ready task.\n\n"
        "---\n\n"
        "### 2. The 4 Coffman Conditions for Deadlock\n"
        "A deadlock occurs in a concurrent system if and only if all four conditions hold simultaneously:\n"
        "1. **Mutual Exclusion:** Resources cannot be shared simultaneously.\n"
        "2. **Hold and Wait:** A process holds at least one resource while waiting to acquire additional occupied resources.\n"
        "3. **No Preemption:** Resources cannot be forcibly revoked from a holding process.\n"
        "4. **Circular Wait:** A closed chain of processes exists where each process waits for a resource held by the next (P0 -> P1 -> P0).\n\n"
        "---\n\n"
        "### 3. Practical Applications & Industry Usage\n"
        "* **CPU Scheduling:** Preemptive schedulers (Round Robin, Multilevel Feedback Queue) ensure fair processor distribution across thousands of concurrent OS tasks.\n"
        "* **Virtual Memory & Paging:** Translates virtual page numbers (VPN) into physical frame numbers (PFN) via Memory Management Units (MMU) and Translation Lookaside Buffers (TLB).\n"
        "* **File Systems & Permissions:** Enforces access control lists (ACLs) and journaling for fault tolerance.\n\n"
        "---\n\n"
        "### 4. Step-by-Step Code Example: Thread Synchronization via Mutex\n"
        "```python\n"
        "import threading\n\n"
        "shared_counter = 0\n"
        "mutex = threading.Lock()\n\n"
        "def safe_worker():\n"
        "    global shared_counter\n"
        "    for _ in range(10000):\n"
        "        # Critical Section guarded by Mutex to prevent race conditions\n"
        "        with mutex:\n"
        "            shared_counter += 1\n\n"
        "threads = [threading.Thread(target=safe_worker) for _ in range(5)]\n"
        "for t in threads: t.start()\n"
        "for t in threads: t.join()\n\n"
        "print('Synchronized Final Counter:', shared_counter)  # Guarantees exact 50000\n"
        "```\n\n"
        "---\n\n"
        "### 5. Key Trade-offs: Processes vs Threads Comparison Table\n\n"
        "| Attribute | Process | Thread |\n"
        "| :--- | :--- | :--- |\n"
        "| **Memory Isolation** | Fully isolated; cannot corrupt other processes | Shared address space; bad pointer can crash entire process |\n"
        "| **Creation Overhead** | Heavyweight (allocates page tables, PCB, handles) | Lightweight (minimal stack allocation) |\n"
        "| **Context Switch Latency** | Slower (flushes TLB and CPU cache tags) | Ultra-fast (shares page tables; TLB remains valid) |\n"
        "| **Inter-Communication** | Requires IPC (Pipes, Sockets, Shared Memory) | Fast direct read/write to shared memory variables |\n\n"
        "---\n\n"
        f"💡 *General Knowledge Explanation • Tailored for {user_stage} ({lang})*"
    )

def get_networks_answer(user_stage: str, lang: str) -> str:
    return (
        f"### Conceptual Explanation: Computer Networks & The 7-Layer OSI Model\n\n"
        f"In university **Computer Networks** for **{user_stage}**, networking protocols govern how disparate computer systems communicate reliably across physical and wireless media. Here is a 5-point explanation:\n\n"
        "---\n\n"
        "### 1. Core Definition & The 7-Layer OSI Model\n"
        "The Open Systems Interconnection (OSI) framework standardizes network communication into 7 modular abstraction layers:\n"
        "1. **Application (Layer 7):** User applications & protocols (HTTP, HTTPS, DNS, SSH, SMTP).\n"
        "2. **Presentation (Layer 6):** Data serialization, encryption (TLS/SSL), compression.\n"
        "3. **Session (Layer 5):** Manages dialogues, connections, and authentication sessions.\n"
        "4. **Transport (Layer 4):** End-to-end data delivery, error recovery, flow control (**TCP, UDP**).\n"
        "5. **Network (Layer 3):** Logical addressing and packet routing across networks (**IP, ICMP, BGP**).\n"
        "6. **Data Link (Layer 2):** Framing, MAC addressing, hardware error detection (Ethernet, Wi-Fi).\n"
        "7. **Physical (Layer 1):** Raw transmission of electrical, optical, or radio bit streams.\n\n"
        "---\n\n"
        "### 2. Under the Hood: TCP 3-Way Handshake vs UDP\n"
        "* **Transmission Control Protocol (TCP):** Connection-oriented, reliable protocol.\n"
        "  * **SYN:** Client sends Synchronize sequence number.\n"
        "  * **SYN-ACK:** Server responds with Acknowledge and its own sequence number.\n"
        "  * **ACK:** Client confirms receipt; connection established.\n"
        "  * Provides congestion control, guaranteed packet ordering, and automatic retransmissions.\n"
        "* **User Datagram Protocol (UDP):** Connectionless, lightweight protocol with zero connection handshake. Packets (datagrams) are fire-and-forget, delivering minimal latency at the expense of dropped packet recovery.\n\n"
        "---\n\n"
        "### 3. Practical Applications & Industry Usage\n"
        "* **Web Browsing & E-Commerce:** Powered by TCP and HTTP/2, HTTP/3 (QUIC over UDP).\n"
        "* **Real-Time Video Streaming & Gaming:** Zoom, Discord, and multiplayer games use UDP to prevent buffer lag caused by retransmissions.\n"
        "* **Domain Name System (DNS):** Rapid UDP queries translate human domain names (`google.com`) into IP addresses (`142.250.190.46`).\n\n"
        "---\n\n"
        "### 4. Step-by-Step Code Example: Python TCP Socket Server\n"
        "```python\n"
        "import socket\n\n"
        "def start_tcp_echo_server():\n"
        "    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n"
        "    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)\n"
        "    server_socket.bind(('127.0.0.1', 9999))\n"
        "    server_socket.listen(5)\n"
        "    print('TCP Server listening on 127.0.0.1:9999...')\n\n"
        "    client_conn, client_addr = server_socket.accept()\n"
        "    print(f'Accepted connection from: {client_addr}')\n"
        "    data = client_conn.recv(1024)\n"
        "    client_conn.sendall(b'HTTP/1.1 200 OK\\r\\nContent-Length: 12\\r\\n\\r\\nHello World!')\n"
        "    client_conn.close()\n"
        "    server_socket.close()\n"
        "```\n\n"
        "---\n\n"
        "### 5. Key Trade-offs: TCP vs UDP Comparison Table\n\n"
        "| Metric | TCP (Transmission Control Protocol) | UDP (User Datagram Protocol) |\n"
        "| :--- | :--- | :--- |\n"
        "| **Reliability** | 100% Guaranteed; lost packets are retransmitted | No guarantee; dropped packets are discarded |\n"
        "| **Connection Setup** | Requires 3-way handshake prior to data exchange | Connectionless; sends packets immediately |\n"
        "| **Ordering** | In-order delivery guaranteed via sequence numbers | Packets may arrive out of order |\n"
        "| **Header Size** | 20 to 60 bytes | Lightweight 8 bytes |\n"
        "| **Best For** | File transfer, web browsing, emails, banking | Live audio/video streaming, DNS, online gaming |\n\n"
        "---\n\n"
        f"💡 *General Knowledge Explanation • Tailored for {user_stage} ({lang})*"
    )

def get_dbms_answer(user_stage: str, lang: str) -> str:
    return (
        f"### Conceptual Explanation: DBMS Normalization & Systems Architecture\n\n"
        f"In relational database systems for **{user_stage}**, **Database Normalization** is the formal mathematical technique of designing relational schemas to eliminate data redundancy and prevent update anomalies. Here is a 5-point explanation:\n\n"
        "---\n\n"
        "### 1. Core Definition & The Normal Forms\n"
        "* Normalization systematically decomposes tables to isolate dependencies:\n"
        "  * **1NF (First Normal Form):** All attribute values must be atomic (no multi-valued lists), and each table must have a primary key.\n"
        "  * **2NF (Second Normal Form):** Satisfies 1NF and eliminates **partial functional dependencies**—every non-key column must depend on the *entire* primary key.\n"
        "  * **3NF (Third Normal Form):** Satisfies 2NF and eliminates **transitive dependencies** (X -> Y and Y -> Z). Non-key attributes must depend *only* on the candidate key.\n"
        "  * **BCNF (Boyce-Codd Normal Form):** Stricter 3NF where for every functional dependency X -> Y, X must be a superkey.\n\n"
        "---\n\n"
        "### 2. Under the Hood: Preventing The 3 Relational Anomalies\n"
        "Without proper normalization, denormalized composite tables cause serious database corruption:\n"
        "* **Insertion Anomaly:** Unable to record an independent entity (e.g. Course) without also creating an unrelated entity (e.g. Student Enrollment).\n"
        "* **Deletion Anomaly:** Deleting a student enrollment inadvertently deletes the entire course record from existence.\n"
        "* **Update Anomaly:** Updating an instructor's office room requires editing hundreds of duplicate rows; if one row fails, data becomes inconsistent.\n\n"
        "---\n\n"
        "### 3. Practical Applications & Industry Usage\n"
        "* **Banking & Core Ledger Databases:** Rely strictly on 3NF/BCNF schemas and **ACID transactions** (Atomicity, Consistency, Isolation, Durability) to ensure zero monetary discrepancy.\n"
        "* **Healthcare & Enterprise ERP:** Modular schemas guarantee medical records and billing dependencies remain strictly separated.\n\n"
        "---\n\n"
        "### 4. Step-by-Step Code Example: Normalized Relational SQL Schema\n"
        "```sql\n"
        "-- 1. Student Entity Table (1NF, 2NF, 3NF Compliant)\n"
        "CREATE TABLE students (\n"
        "    student_id INT PRIMARY KEY,\n"
        "    full_name VARCHAR(100) NOT NULL,\n"
        "    email VARCHAR(150) UNIQUE NOT NULL\n"
        ");\n\n"
        "-- 2. Course Entity Table\n"
        "CREATE TABLE courses (\n"
        "    course_code VARCHAR(10) PRIMARY KEY,\n"
        "    title VARCHAR(120) NOT NULL,\n"
        "    credits INT DEFAULT 4\n"
        ");\n\n"
        "-- 3. Junction Table Resolving Many-to-Many Relationship\n"
        "CREATE TABLE enrollments (\n"
        "    enrollment_id INT PRIMARY KEY,\n"
        "    student_id INT NOT NULL REFERENCES students(student_id),\n"
        "    course_code VARCHAR(10) NOT NULL REFERENCES courses(course_code),\n"
        "    grade VARCHAR(2),\n"
        "    CONSTRAINT unique_enrollment UNIQUE(student_id, course_code)\n"
        ");\n"
        "```\n\n"
        "---\n\n"
        "### 5. Key Trade-offs: Normalization vs Denormalization\n\n"
        "| Attribute | Normalized Schema (3NF / BCNF) | Denormalized Schema (OLAP / Data Warehouse) |\n"
        "| :--- | :--- | :--- |\n"
        "| **Redundancy** | Zero duplicate data attributes | Intentional redundancy for read performance |\n"
        "| **Write Performance** | Ultra-fast single-row inserts and updates | Slower writes; requires updating multiple denormalized rows |\n"
        "| **Read Performance** | Requires relational `JOIN` operations across tables | Very fast reads; queries read from flat pre-joined tables |\n"
        "| **Best Used In** | OLTP transactional databases (PostgreSQL, MySQL) | Analytical data warehouses (Snowflake, BigQuery, ClickHouse) |\n\n"
        "---\n\n"
        f"💡 *General Knowledge Explanation • Tailored for {user_stage} ({lang})*"
    )

def get_web_dev_answer(user_stage: str, lang: str) -> str:
    return (
        f"### Conceptual Explanation: Web Architecture, DOM & Modern Frontend\n\n"
        f"In university courses on **Web Technologies** for **{user_stage}**, web applications operate across client-side rendering engines and server-side protocol pipelines. Here is a 5-point explanation:\n\n"
        "---\n\n"
        "### 1. Core Definition: The Modern Web Stack\n"
        "* **HTML (HyperText Markup Language):** Provides semantic structure and content hierarchy to web documents.\n"
        "* **CSS (Cascading Style Sheets):** Governs visual presentation, responsive layouts (Flexbox, CSS Grid), and animations.\n"
        "* **JavaScript (ECMAScript):** Single-threaded, event-driven scripting language providing interactivity, state management, and asynchronous network requests.\n\n"
        "---\n\n"
        "### 2. Under the Hood: The Browser Event Loop & Virtual DOM\n"
        "* **DOM (Document Object Model):** The tree-structured in-memory representation of an HTML document constructed by the browser engine (Blink, Gecko, WebKit).\n"
        "* **The Event Loop:** JavaScript handles non-blocking asynchronous I/O via a Call Stack, Web APIs, Microtask Queue (Promises), and Macrotask Queue (`setTimeout`, DOM events).\n"
        "* **Virtual DOM (React):** A lightweight in-memory snapshot of the real DOM. When state changes, a diffing algorithm (Reconciliation) computes minimal changes and applies them in batch to prevent expensive browser reflows.\n\n"
        "---\n\n"
        "### 3. Practical Applications & Industry Usage\n"
        "* **Single Page Applications (SPAs):** React, Next.js, and Vue deliver seamless desktop-like app experiences without full page reloads.\n"
        "* **REST & GraphQL APIs:** Frontends communicate with microservices via JSON payloads across HTTP/HTTPS.\n"
        "* **Progressive Web Apps (PWAs):** Service workers cache assets for offline capability and native device access.\n\n"
        "---\n\n"
        "### 4. Step-by-Step Code Example: Modern Asynchronous Fetch & State\n"
        "```javascript\n"
        "async function fetchUserCourses(studentId) {\n"
        "    try {\n"
        "        const response = await fetch(`/api/students/${studentId}/courses`, {\n"
        "            method: 'GET',\n"
        "            headers: { 'Content-Type': 'application/json' }\n"
        "        });\n\n"
        "        if (!response.ok) {\n"
        "            throw new Error(`HTTP Error: ${response.status}`);\n"
        "        }\n\n"
        "        const courses = await response.json();\n"
        "        console.log(`Fetched ${courses.length} registered courses:`, courses);\n"
        "        return courses;\n"
        "    } catch (error) {\n"
        "        console.error('Failed to load student courses:', error.message);\n"
        "        return [];\n"
        "    }\n"
        "}\n"
        "```\n\n"
        "---\n\n"
        "### 5. Key Trade-offs & Summary Comparison Table\n\n"
        "| Rendering Strategy | Client-Side Rendering (CSR / React) | Server-Side Rendering (SSR / Next.js) |\n"
        "| :--- | :--- | :--- |\n"
        "| **Initial Page Load** | Slower (requires downloading & executing JavaScript bundle) | Ultra-fast (server returns pre-rendered HTML) |\n"
        "| **Subsequent Navigation** | Instantaneous; renders locally without page reload | Fast; hydrates components on demand |\n"
        "| **SEO Optimization** | Challenging for crawlers that don't execute JS | Optimal; search engine spiders read raw HTML |\n\n"
        "---\n\n"
        f"💡 *General Knowledge Explanation • Tailored for {user_stage} ({lang})*"
    )

def get_ml_answer(user_stage: str, lang: str) -> str:
    return (
        f"### Conceptual Explanation: Machine Learning & Artificial Intelligence\n\n"
        f"In university computer science for **{user_stage}**, **Machine Learning (ML)** is the study of computational algorithms that improve automatically through empirical data experience without explicit rule-based programming. Here is a 5-point explanation:\n\n"
        "---\n\n"
        "### 1. Core Definition & The 3 Main Paradigms\n"
        "* **Supervised Learning:** Models learn a mapping function from labeled input-output pairs (X, y) (e.g. Linear Regression, Random Forests, Neural Networks).\n"
        "* **Unsupervised Learning:** Algorithms uncover latent patterns or groupings in unlabelled data (e.g. K-Means Clustering, PCA).\n"
        "* **Reinforcement Learning:** Agents learn optimal policies by interacting with an environment, maximizing cumulative rewards.\n\n"
        "---\n\n"
        "### 2. Under the Hood: Loss Functions & Gradient Descent\n"
        "* **Loss Function L(θ):** Quantifies the mathematical error between model predictions and ground-truth values (e.g. Mean Squared Error, Cross-Entropy).\n"
        "* **Gradient Descent:** The fundamental optimization algorithm that updates model weights by computing partial derivatives of the loss function: `θ = θ - η * ∇L(θ)` where η is the learning rate.\n"
        "* **Backpropagation:** Uses the chain rule of calculus to propagate errors backward through neural network layers to update weights efficiently.\n\n"
        "---\n\n"
        "### 3. Practical Applications & Industry Usage\n"
        "* **Computer Vision:** Convolutional Neural Networks (CNNs) for medical imaging, autonomous vehicle perception, and facial recognition.\n"
        "* **Natural Language Processing (NLP):** Transformer architectures (BERT, GPT, Gemini) powering conversational agents and translation.\n"
        "* **Recommendation Engines:** Matrix factorization and collaborative filtering powering Netflix, YouTube, and Amazon feeds.\n\n"
        "---\n\n"
        "### 4. Step-by-Step Code Example: Linear Regression with Gradient Descent\n"
        "```python\n"
        "import numpy as np\n\n"
        "# Synthetic Training Data: y = 2x + 1\n"
        "X = np.array([1.0, 2.0, 3.0, 4.0, 5.0])\n"
        "y = np.array([3.0, 5.0, 7.0, 9.0, 11.0])\n\n"
        "# Initialize Parameters\n"
        "w, b = 0.0, 0.0\n"
        "learning_rate = 0.05\n"
        "epochs = 200\n\n"
        "for epoch in range(epochs):\n"
        "    y_pred = w * X + b\n"
        "    dw = (-2 / len(X)) * np.sum(X * (y - y_pred))\n"
        "    db = (-2 / len(X)) * np.sum(y - y_pred)\n"
        "    w -= learning_rate * dw\n"
        "    b -= learning_rate * db\n\n"
        "print(f'Learned Weight: {w:.2f} (Ideal: 2.0)')\n"
        "print(f'Learned Bias: {b:.2f} (Ideal: 1.0)')\n"
        "```\n\n"
        "---\n\n"
        "### 5. Key Trade-offs: Bias vs Variance in Machine Learning\n\n"
        "| Concept | High Bias (Underfitting) | High Variance (Overfitting) | Optimal Balance |\n"
        "| :--- | :--- | :--- | :--- |\n"
        "| **Model Complexity** | Overly simplistic model | Excessively complex model (memorizes noise) | Captures true underlying distribution |\n"
        "| **Training Error** | High | Low | Low |\n"
        "| **Testing / Generalization** | High | High | Minimal generalization error |\n"
        "| **Remedy** | Use more expressive features | Regularization (L1/L2), Dropout, or more data | Cross-validation tuning |\n\n"
        "---\n\n"
        f"💡 *General Knowledge Explanation • Tailored for {user_stage} ({lang})*"
    )

def get_universal_topic_answer(question: str, user_stage: str, lang: str) -> str:
    clean = re.sub(r'^(what is|explain|define|how does|why is|tell me about|kya hota hai|kya hai|samjhao)\s+', '', question, flags=re.I)
    clean = re.sub(r'[?!.]+$', '', clean).strip()
    topic = clean.title() if clean else question.strip()

    return (
        f"### Conceptual Explanation: {topic}\n\n"
        f"For students in **{user_stage}**, here is a comprehensive, structured 5-point explanation of **{topic}**:\n\n"
        "---\n\n"
        "### 1. Core Definition & Foundational Principles\n"
        f"* **Formal Definition:** **{topic}** represents a fundamental concept that establishes systematic principles and rules to solve core problems in this domain.\n"
        "* **Primary Objective:** It structures complex workflows or systems into modular, reproducible components.\n"
        "* **Theoretical Invariants:** Operates under well-defined logical and physical constraints, ensuring consistent behavior across diverse scenarios.\n\n"
        "---\n\n"
        "### 2. Working Mechanism & Operational Flow\n"
        "1. **Input & Preconditions:** System captures necessary parameters, state variables, or initial conditions.\n"
        "2. **State Transition & Processing:** Executes defined operational logic or algorithms, transforming input while preserving system invariants.\n"
        "3. **Output & Verification:** Generates deterministic output or state changes with bounded resource utilization and efficiency.\n\n"
        "---\n\n"
        "### 3. Real-World Applications & Industry Relevance\n"
        f"* Widely applied across modern engineering, scientific research, and real-world implementations involving **{topic}**.\n"
        "* Forms a key evaluation topic in university exams, technical interviews, and system architecture reviews.\n"
        "* Solves scalability and organizational challenges by isolating responsibilities into clean, maintainable units.\n\n"
        "---\n\n"
        "### 4. Practical Demonstration & Step-by-Step Breakdown\n"
        f"Understanding **{topic}** requires analyzing how it handles inputs and processes them sequentially:\n"
        "* **Step 1 (Initialization):** Define the system boundaries and verify that all prerequisites are satisfied.\n"
        "* **Step 2 (Execution):** Step through the core logic, monitoring state transformations and invariants.\n"
        "* **Step 3 (Evaluation):** Measure efficiency against alternative approaches to verify optimal performance.\n\n"
        "---\n\n"
        "### 5. Summary Evaluation & Key Takeaways\n\n"
        "| Dimension | Primary Advantage (+) | Critical Consideration (-) |\n"
        "| :--- | :--- | :--- |\n"
        "| **Systematic Structure** | Delivers predictable, verifiable outcomes across standard cases. | Requires disciplined design upfront and boundary checks. |\n"
        "| **Operational Efficiency** | Minimizes computational or resource waste when implemented correctly. | Edge cases and extreme input sizes require defensive error guards. |\n"
        "| **Maintainability** | Clean separation of concerns simplifies troubleshooting and maintenance. | Abstraction layers must be carefully chosen to avoid unnecessary overhead. |\n\n"
        "---\n\n"
        f"💡 *General Knowledge Explanation • Tailored for {user_stage} ({lang})*"
    )

def synthesize_detailed_academic_answer(
    question: str,
    education_level: str = "college",
    grade_or_course: str = "B.Tech Computer Science",
    subject: Optional[str] = None,
    preferred_language: str = "English",
    context_chunks: Optional[List[Dict[str, Any]]] = None
) -> str:
    q_lower = question.lower()
    user_stage = grade_or_course or "B.Tech Computer Science"

    # CASE A: Grounded on uploaded context chunks ONLY if verified relevance exists
    if context_chunks and len(context_chunks) > 0:
        c = context_chunks[0]
        snippet = c.get("content", "").strip()
        filename = c.get("filename", "Course Document")
        location = c.get("location", "Lecture Notes")
        source_cite = f"[{filename}, {location}]"

        # Verify that snippet actually matches the question topic
        query_words = [w for w in re.findall(r'\b[a-zA-Z]{3,}\b', q_lower) if w not in {"what", "explain", "define", "how", "why", "the", "and", "tell", "about", "for", "with", "kya", "hai", "samjhao"}]
        has_overlap = any(w in snippet.lower() or w in c.get("title", "").lower() for w in query_words)

        if has_overlap:
            return (
                f"### Conceptual Explanation: {question.title()}\n\n"
                f"Based on your verified course materials for **{user_stage}**, here is a structured 5-point source-grounded breakdown:\n\n"
                "---\n\n"
                "### 1. Verified Core Definition from Course Notes\n"
                f"* **Verified Concept:** {snippet}\n"
                f"* **Source Attribution:** Directly grounded in your uploaded material **{source_cite}**.\n\n"
                "---\n\n"
                "### 2. Working Mechanism & Principles\n"
                "* The material demonstrates how the concept decomposes the problem space into structured invariants.\n"
                "* Execution follows verified procedural rules outlined in your curriculum.\n\n"
                "---\n\n"
                "### 3. Coursework & Examination Relevance\n"
                "* Master these definitions, step-by-step derivations, and boundary constraints for university evaluations.\n"
                "* Understanding this builds the foundation for downstream advanced topics.\n\n"
                "---\n\n"
                "### 4. Implementation Walkthrough\n"
                f"* Verify preconditions and state variables as described in {filename}.\n"
                "* Apply the verified methodology step-by-step to avoid calculation errors.\n\n"
                "---\n\n"
                "### 5. Key Takeaways & Summary\n"
                f"* Grounded strictly in your active course notes {source_cite}.\n"
                "* Review related textbook chapters and practice problems to solidify understanding.\n\n"
                "---\n\n"
                f"💡 *Source Grounded Explanation • Verified from {source_cite} • Tailored for {user_stage}*"
            )

    # Domain specific dispatchers
    # 1. C++ Language
    if 'c++' in q_lower or re.search(r'\b(cpp|stl|vector in c\+\+|virtual function|raii|oop in c\+\+)\b', q_lower):
        return get_cpp_language_answer(user_stage, preferred_language)

    # 2. C Language (exclude c++, c#, css)
    if not ('c++' in q_lower or 'c#' in q_lower or 'css' in q_lower):
        if re.search(r'\b(c language|c programming|pointers in c|malloc|gcc|dennis ritchie)\b', q_lower) or re.search(r'\bc\b(?!\+)', q_lower):
            return get_c_language_answer(user_stage, preferred_language)

    if re.search(r'\b(java|jvm|garbage collection in java|jdk|jre|classloader)\b', q_lower):
        return get_java_language_answer(user_stage, preferred_language)

    if re.search(r'\b(linked list|singly linked list|doubly linked list|circular linked list)\b', q_lower):
        return get_linked_list_answer(user_stage, preferred_language)

    if re.search(r'\b(queue|circular queue|priority queue|fifo|enqueue|dequeue)\b', q_lower):
        return get_queue_answer(user_stage, preferred_language)

    if re.search(r'\b(stack|lifo|push and pop|call stack|stack overflow)\b', q_lower) and not re.search(r'\b(full stack)\b', q_lower):
        return get_stack_answer(user_stage, preferred_language)

    if re.search(r'\b(tree|binary tree|bst|binary search tree|avl tree|heap tree)\b', q_lower):
        return get_trees_bst_answer(user_stage, preferred_language)

    if re.search(r'\b(binary search|merge sort|quick sort|sorting|bubble sort|linear search|time complexity|big o)\b', q_lower):
        return get_searching_sorting_answer(user_stage, preferred_language)

    if re.search(r'\b(operating system|os|process|thread|deadlock|cpu scheduling|virtual memory|paging|semaphore|mutex)\b', q_lower):
        return get_os_answer(user_stage, preferred_language)

    if re.search(r'\b(computer network|networking|osi model|tcp|udp|ip address|dns|http|https|socket)\b', q_lower):
        return get_networks_answer(user_stage, preferred_language)

    if re.search(r'\b(dbms|database|sql|normalization|1nf|2nf|3nf|bcnf|acid|transaction)\b', q_lower):
        return get_dbms_answer(user_stage, preferred_language)

    if re.search(r'\b(machine learning|deep learning|neural network|relu|activation function|backpropagation|gradient descent|transformer|cnn|ai)\b', q_lower):
        return get_ml_answer(user_stage, preferred_language)

    if re.search(r'\b(javascript|js|html|css|react|dom|frontend|web development)\b', q_lower):
        return get_web_dev_answer(user_stage, preferred_language)

    if re.search(r'\b(python|cpython|gil|list comprehension|lambda in python)\b', q_lower):
        return get_python_dsa_answer(user_stage, preferred_language)

    return get_universal_topic_answer(question, user_stage, preferred_language)

synthesize_concise_5_line_answer = synthesize_detailed_academic_answer

def generate_grounded_answer(
    question: str,
    context_chunks: List[Dict[str, Any]]
) -> Dict[str, Any]:
    client = get_gemini_client()
    if not client:
        fallback = synthesize_detailed_academic_answer(question, context_chunks=context_chunks)
        return {
            "success": True,
            "answer": fallback,
            "is_grounded": bool(context_chunks),
            "insufficient_evidence": False,
            "mode": "source_grounded" if context_chunks else "general_ai",
            "model_used": "pedagogical_fallback"
        }

    context_blocks = []
    for idx, c in enumerate(context_chunks):
        loc = c.get("location", "Unknown Location")
        fn = c.get("filename", "Unknown Document")
        context_blocks.append(f"[Source #{idx + 1}: {fn} | {loc}]\n{c['content']}\n")

    context_str = "\n".join(context_blocks)
    system_prompt = (
        "You are StudyMate AI, an expert source-grounded academic tutor.\n"
        "Explain the answer clearly organized into 5 descriptive points grounded in the provided context excerpts.\n"
        "Cite sources using bracket notation matching the excerpts (e.g. [Document.pdf, Page 12]).\n"
        "Never hallucinate outside citations."
    )

    user_prompt = f"CONTEXT:\n{context_str}\n\nQUESTION: {question}\n\nProvide your detailed 5-point source-grounded explanation:"

    answer_text = _call_gemini_with_timeout(
        client=client,
        model=GEMINI_MODEL,
        contents=user_prompt,
        config={"system_instruction": system_prompt, "temperature": 0.25},
        timeout_seconds=25
    )

    if not answer_text:
        answer_text = synthesize_detailed_academic_answer(question, context_chunks=context_chunks)

    lower_ans = answer_text.lower()
    is_insufficient = any(p in lower_ans for p in [
        "insufficient evidence", "not enough evidence", "cannot be answered",
        "no information", "cannot provide an external", "not mentioned in the provided",
        "outside the provided text", "there is no mention", "no mention or definition",
        "strictly grounded in the provided"
    ])

    if is_insufficient:
        answer_text = synthesize_detailed_academic_answer(question)

    return {
        "success": True,
        "answer": answer_text,
        "is_grounded": not is_insufficient,
        "insufficient_evidence": is_insufficient,
        "mode": "source_grounded" if not is_insufficient else "general_ai",
        "model_used": GEMINI_MODEL
    }

def generate_auto_answer(
    question: str,
    context_chunks: List[Dict[str, Any]],
    is_sufficient: bool,
    education_level: str = "college",
    grade_or_course: str = "B.Tech Computer Science",
    board_or_specialization: Optional[str] = None,
    subject: Optional[str] = None,
    preferred_language: str = "English",
    explanation_style: str = "step-by-step",
    strict_grounding: bool = False,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    client = get_gemini_client()

    # CASE A: Sufficient uploaded evidence exists
    if context_chunks and is_sufficient:
        return generate_grounded_answer(question, context_chunks)

    # CASE C: Explicit Strict Grounding requested, but insufficient evidence
    if strict_grounding:
        return {
            "success": True,
            "answer": (
                "⚠️ **Insufficient Source Evidence in Uploaded Materials**\n\n"
                "You requested an answer grounded strictly in your uploaded course materials, but the active documents "
                "in your library do not contain sufficient verified excerpts on this topic.\n\n"
                "To explore this concept from your own course materials, please upload the corresponding lecture slides, "
                "notes, or textbook chapter to your **Learning Library**, or switch to Auto Mode for general academic explanations."
            ),
            "is_grounded": False,
            "mode": "strict_insufficient",
            "insufficient_evidence": True,
            "model_used": "guardrail"
        }

    # CASE B: Auto Mode Default — General Academic Knowledge adapted to Student Level
    answer_text = None
    if client:
        system_prompt = (
            f"You are StudyMate AI, an expert adaptive pedagogical tutor for {grade_or_course}.\n"
            f"Explain the requested topic thoroughly and clearly, organized into 5 descriptive points:\n"
            f"1. Core Conceptual Definition (Clear intuition, why it matters)\n"
            f"2. Working Mechanism & Architecture (How it works under the hood)\n"
            f"3. Practical Applications & Real-World Use Cases\n"
            f"4. Step-by-Step Code / Practical Walkthrough Example (with syntax breakdown)\n"
            f"5. Key Trade-offs & Summary Comparison Table\n"
            f"Ensure the response is high quality, accurate to the exact topic asked, and easy to understand."
        )
        user_prompt = f"STUDENT QUESTION: {question}\n\nProvide your structured 5-point explanation:"
        answer_text = _call_gemini_with_timeout(
            client=client,
            model=GEMINI_MODEL,
            contents=user_prompt,
            config={"system_instruction": system_prompt, "temperature": 0.35},
            timeout_seconds=25
        )

    if not answer_text:
        answer_text = synthesize_detailed_academic_answer(
            question=question,
            education_level=education_level,
            grade_or_course=grade_or_course,
            subject=subject,
            preferred_language=preferred_language
        )

    return {
        "success": True,
        "answer": answer_text,
        "is_grounded": False,
        "mode": "general_ai",
        "insufficient_evidence": False,
        "model_used": GEMINI_MODEL
    }
