# Getting Started

## Installation

Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ethyne.git
```

Move into project

```bash
cd ethyne
```

Install dependencies

```bash
npm install
```

---

## Create Your First Program

Create:

```text
hello.eth
```

Content:

```eth
bol("Hello Ethyne")'
```

Run:

```bash
node cli.js run hello.eth
```

Output:

```text
Hello Ethyne
```

---

## Display Tokens

```bash
ethyne tokens hello.eth
```

---

## Display AST

```bash
ethyne ast hello.eth
```

---

## Generate JavaScript

```bash
ethyne build hello.eth
```
