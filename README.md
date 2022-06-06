
> 注意：该项目仅供学习区块链知识，不作为任何投资建议。市场有风险，投资需谨慎。

本文项目代码：

[https://github.com/hicoldcat/eth-solidity-token-example](https://github.com/hicoldcat/eth-solidity-token-example)

原文地址：

[https://hicoldcat.com/posts/blockchain/my-token/](https://hicoldcat.com/posts/blockchain/my-token/)

## 1、初始化项目
> [Hardhat](https://hardhat.org/)是一个编译、部署、测试和调试以太坊应用的开发环境。它可以帮助开发人员管理和自动化构建智能合约和DApps过程中固有的重复性任务，并围绕这一工作流程轻松引入更多功能。这意味着hardhat最核心的地方是编译、运行和测试智能合约。

创建npm项目`eth-solidity-token-example`，进入项目文件夹，安装hardhat

```bash
npm init

npm install --save-dev hardhat
```

创建Hardhat项目

```bash
npx hardhat
```

![](https://cdn.jsdelivr.net/gh/hicoldcat/assets@main/img/20220429160229.png)

## 2、开发合约
> [Solidity](https://soliditylang.org/)是一门面向合约的、为实现智能合约而创建的高级编程语言。

contracts 目录下有`Greeter.sol`文件，这是hardhat提供的一个demo文件，实现了简单的打招呼功能。`.sol`文件是Solidity文件的后缀。Solidity 是在Ethereum 上开发智能合约的一门编程语言，具体语法可以参考上面的官方文档。

在contracts目录下，创建我们自己的代币合约文件`Fool.sol`(傻瓜币)，代码如下：

```sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @custom:security-contact hicoldcat@foxmail.com
contract Fool is ERC20, ERC20Burnable, Pausable, Ownable {
    constructor() ERC20("Fool", "FOOL") {
        _mint(msg.sender, 100000000 * 10 ** decimals());
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}

```

首先，需要说一下代码中`is`之后继承的几个接口和合约标准，

#### *ERC20*

该智能合约继承了`ERC20`标准。`ERC20`是以太坊同质化代币的标准，由V神2015年提出。`ERC`是`Ethereum Request for Comment `的缩写，因为是从[EIPs](https://github.com/ethereum/EIPs)20号提案通过的，因此称为`ERC20`。其他标准如`ERC721`（非同质化代币），就是常说的`NFT`。

代码中的`ERC20`是由`@openzeppelin/contracts`包提供的`IERC20`的实现。主要实现了如返回代币总数`totalSupply()`，返回特定账户余额`balanceOf(account)`，转账到指定账户`transfer(to, amount)`，允许某个账户代持主账户代币的剩余数量`allowance(owner, spender)`，委托特定账户一定数量的代币`approve(spender, amount)`，从账户转账到另一个账户代币`transferFrom(from, to, amount)`等方法，和一些如代币名称、简写等一些属性的方法。详细可以去看官方[ERC20](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md)具体实现。


#### *ERC20Burnable*
实现允许代币持有者可以以区块链允许的方式来销毁他们自己的代币或者他们被委托的代币的方法。

代码主要包括了`burn(uint256 amount)`销毁当前调用者指定数量的代币，和`burnFrom(address account, uint256 amount)`销毁指定账户指定数量的代币。可参考代码`@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol`。

#### *Pausable*
使代币具有可以暂停转移、暂停铸造和暂停燃烧的功能。这个功能一般会对于出现一些重大错误或者阻止一些错误交易时来冻结所有代币等场景下有很重要的作用。

所以调用代码`pause()`和`unpause()`会实现暂停和停止暂停交易的功能。

钩子函数`_beforeTokenTransfer(address from, address to, uint256 amount)`会在未被暂停交易，并且交易之前调用，包括铸造和燃烧。

#### *Ownable*

智能合约最基本的访问控制机制，只有账户所有者能够对特定功能有访问权限。账户所有者指的是部署合约的账户。如代码中具有修饰符`onlyOwner`的`pause()`和`unpause()`,就是只能由账户所有者调用。

至此，一个基本的代币合约就完成了。需要注意的是，上面代码中，一些基本的如获取Token名称的方法`name()`，交易转账的方法`transfer(address to, uint256 amount)`等，都封装到了`import "@openzeppelin/contracts/token/ERC20/ERC20.sol";`中，详细代码如下，也可以通过github源码[https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol)去查看。

## 3、编译合约

在项目根目录下运行如下命令：

```bash
 npx hardhat compile
```
hardhat会查找项目下所有的智能合约，并根据`hardhat.config.js`配置文件生成编译完成之后的`artifacts`文件目录。

![compile](https://cdn.jsdelivr.net/gh/hicoldcat/assets@main/img/20220502154746.png)

## 4、部署合约

1、首先，创建部署脚本。在项目`scripts`目录下，创建`deploy.js`部署脚本，代码如下：

```js
const hre = require("hardhat");

async function main() {
    const [owner] = await hre.ethers.getSigners();

    console.log(`部署合约的账户地址为：`, owner.address);
    console.log("账户余额为:", (await owner.getBalance()).toString());
    console.log("合约部署的链ID为:", (await owner.getChainId()).toString());

    // 获取Fool智能合约
    const Fool = await hre.ethers.getContractFactory("Fool");
    const fool = await Fool.deploy();

    // 部署合约
    await fool.deployed();

    console.log("当前合约部署地址为:", fool.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

```

2、启动本地节点，运行localhost测试网络,
```shell
 npx hardhat node
```

![localhost](https://cdn.jsdelivr.net/gh/hicoldcat/assets@main/img/20220502161938.png)

*注意：这些账户地址和私钥都是公开在网络中的，千万不要在主网上向这些地址转币，否则会丢失掉！！！*

3、在另一个终端中，使用localhost测试网络部署智能合约。

```shell
npx hardhat run --network localhost scripts/deploy.js
```

![run](https://cdn.jsdelivr.net/gh/hicoldcat/assets@main/img/20220502162649.png)

可以看到，合约已经部署到了localhost测试网络上，合约持有人，账户余额，合约部署的链ID，合约地址如下：

```text
部署合约的账户地址为： 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
账户余额为: 10000000000000000000000
合约部署的链ID为: 31337
当前合约部署地址为: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

此时，我们之前运行的本地节点上，也收到了部署的信息，如下

![message](https://cdn.jsdelivr.net/gh/hicoldcat/assets@main/img/20220502162917.png)

其中，值得注意的是如下代码：

```
eth_sendTransaction
  Contract deployment: Fool
  Contract address:    0x5fbdb2315678afecb367f032d93f642f64180aa3
  Transaction:         0x38ea936e49e59db88cd0e83b25eb78a7f0485aeb21178a36f0838ce7c892037a
  From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  Value:               0 ETH
  Gas used:            1999705 of 1999705
  Block #1:            0xb12312912bdbb42b8d933767e041ead1ef6d50685b6c6ca858d89401dcd31582

```
上面显示的地址和我们打印出来的地址是一致的。此外，`0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`是我们部署本地节点时，获取到的`Account 0`作为我们当前默认的账户。

## 5、搭建本地测试页面
> [ethers.js](https://ethers.org/)是一个专门为以太坊生态提供的JavaScript工具类库，内置了一些钱包和合约的调用方法和其他一些工具函数。

为了方便测试，我们搭建了react项目来实现基本的测试功能。

在新的终端中运行下面命令在项目根目录下生成`web`文件夹

```bash
npx create-react-app web --template typescript
```

进入web目录，在`web`目录下安装`ethers`和`antd`npm包，然后增加`.env`环境变量文件，内容如下：

```
REACT_APP_CONTARCT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
REACT_APP_DEPLOYER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
REACT_APP_DEPLOYER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
REACT_APP_RECIVER = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8"
REACT_APP_RECIVER_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
```

上面包含了之前获取到的合约地址、部署合约的账户地址和私钥、模拟要接收转账的账户地址和私钥。

当前目录下运行项目`npm run start`，将会自动在浏览器中打开`http://localhost:3000`页面。

修改`App.tsx`为如下内容：

```ts
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import ReactJson from 'react-json-view'
import { Button, Card, Col, Input, InputNumber, Layout, Modal, Row, Spin } from 'antd';

import FoolToken from './artifacts/Fool.json';

import './App.css';

const { Content } = Layout;

function App() {
  const {
    REACT_APP_CONTARCT_ADDRESS,
    REACT_APP_DEPLOYER,
    REACT_APP_DEPLOYER_PRIVATE_KEY,
    REACT_APP_RECIVER,
    REACT_APP_RECIVER_PRIVATE_KEY
  } = process.env

  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<any>({});

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState('');

  const [supply, setSupply] = useState('');
  const [ownerBlance, setOwnerBlance] = useState('');
  const [ownerWalletBlance, setOwnerWalletBlance] = useState('');

  const [reciverBlance, setReciverBlance] = useState('');

  const [number, setNumber] = useState(0);
  const [address, setAddress] = useState(REACT_APP_RECIVER)

  const [txs, setTxs] = useState<any>({})

  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8545")
  let wallet = new ethers.Wallet(REACT_APP_DEPLOYER_PRIVATE_KEY!, provider);
  let contract = new ethers.Contract(REACT_APP_CONTARCT_ADDRESS!, FoolToken.abi, provider) // Read-Only
  // let contractRW = new ethers.Contract(REACT_APP_CONTARCT_ADDRESS!, FoolToken.abi, wallet) // Read-Write
  let contractWithSigner = contract.connect(wallet);

  // 合约名称
  async function getName() {
    setName(await contractWithSigner.name());
  }

  // 合约符号
  async function getSymbol() {
    setSymbol(await contractWithSigner.symbol());
  }

  // Decimals
  async function getDecimals() {
    setDecimals(await contractWithSigner.decimals());
  }

  // 合约总供应量
  async function getSupply() {
    setSupply(await contractWithSigner.totalSupply().then((balance: any) => ethers.utils.formatEther(balance)))
  }

  // owner 余额
  async function getOwnerBalance() {
    setOwnerBlance(await contractWithSigner.balanceOf(REACT_APP_DEPLOYER).then((balance: any) => ethers.utils.formatEther(balance)))
  }

  // owner eth 余额
  async function getOwnerWalletBalance() {
    setOwnerWalletBlance(await wallet.getBalance().then((balance: any) => ethers.utils.formatEther(balance)))
  }

  // reciver 余额
  async function getReciverBalance() {
    setReciverBlance(await contractWithSigner.balanceOf(REACT_APP_RECIVER).then((balance: any) => ethers.utils.formatEther(balance)))
  }

  // 查询数据
  const refetch = () => {
    getName()
    getSymbol()
    getDecimals()

    getSupply()
    getOwnerBalance()
    getReciverBalance()

    getOwnerWalletBalance()
  }

  // 发币
  const sendToken = async () => {
    setLoading(true);
    let numberOfTokens = ethers.utils.parseUnits(number.toString(), 18);
    console.log(`numberOfTokens: ${numberOfTokens}`);
    const transaction = await contractWithSigner.transfer(address, numberOfTokens);
    await transaction.wait();
    console.log(`${number} Tokens successfully sent to ${address}`);
    setLoading(false)
    refetch()
  }

  // 交易信息callback
  const onContractTransfer = (from: any, to: any, value: any, event: any) => {
    if (!txs[event.transactionHash]) {
      console.log(event.transactionHash, ethers.utils.formatUnits(value), new Date().getTime());
      setTxs({
        ...txs, [event.transactionHash]: {
          from,
          to,
          value: ethers.utils.formatUnits(value),
          transactionHash: event.transactionHash
        }
      })
    }
  }

  // 点击交易hash显示交易详情
  const showTxDetail = async ({ name, value }: any) => {
    if (name === "transactionHash") {
      const tx = await provider.getTransaction(value)
      setModal({
        hash: value,
        data: tx
      })
    }
  }

  useEffect(() => {
    refetch()
    contractWithSigner.on('Transfer', onContractTransfer)
    return () => {
      contractWithSigner.removeListener('Transfer', () => {
        console.log('contractWithSigner removeListener Transfer ');
      })
    }
  }, [])

  return (
    <Spin spinning={loading}>
      <Layout className='app'>
        <Content>
          <div className='header'>
            <h1>{`傻瓜币（Name：${name} Symbol：${symbol} Decimals：${decimals}）`}</h1>
            合约地址：
            <span className='address'>{REACT_APP_CONTARCT_ADDRESS}</span>
            合约供应量：
            <span className='address'>{supply}</span>
            <div className='notic'>注意：账户地址和私钥均属于网络公开测试，千万不要用于私人转账使用！！！</div>
          </div>
          <Row className='content'>

            {/* Owner */}
            <Col span={12} className="left">
              <Card title='创建者'>
                <div>
                  创建者账户：
                  <span className='address'>{address}</span>
                </div>
                <div>
                  创建者私钥：
                  <span className='address'>{REACT_APP_DEPLOYER_PRIVATE_KEY}</span>
                </div>
                <div>
                  ETH余额：
                  <span className='address'>{ownerWalletBlance}</span>
                </div>
                <div>
                  Fool币余额：
                  <span className='address'>{ownerBlance}</span>
                </div>


                <div className='operate'>
                  <div style={{ marginTop: 16 }}>
                    <Input prefix="收款地址：" value={REACT_APP_RECIVER} readOnly className="input" />
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <InputNumber prefix="转账数量：" value={number} min={0} className="input" onChange={v => setNumber(v)} />
                  </div>

                  <Button style={{ marginTop: 16 }} onClick={sendToken}>发币</Button>
                </div>
              </Card>

            </Col>

            {/* Reciver */}
            <Col span={12} className="right">
              <Card title='接收者'>
                <div>
                  接收者账户：
                  <span className='address'>{REACT_APP_RECIVER}</span>
                </div>
                <div>
                  接收者私钥：
                  <span className='address'>{REACT_APP_RECIVER_PRIVATE_KEY}</span>
                </div>
                <div>
                  Fool余额：
                  <span className='address'>{reciverBlance}</span>
                </div>
              </Card>

            </Col>
          </Row>

          <Card className='tx' title="交易信息" style={{ overflowY: "auto" }}>
            <ReactJson displayDataTypes={false} name={false} src={Object.values(txs)} onSelect={showTxDetail} />
          </Card>

          <Modal
            centered
            destroyOnClose
            width={1000}
            visible={modal && modal.hash}
            title={`交易信息：${modal?.hash}`}
            onOk={() => setModal({})}
            onCancel={() => setModal({})}
          >
            <ReactJson
              style={{ height: 800, overflowY: 'auto' }}
              theme="chalk"
              src={modal && modal.data}
              collapseStringsAfterLength={100}
              onSelect={showTxDetail}
              name={false}
              displayDataTypes={false} />
          </Modal>
        </Content>
      </Layout>
    </Spin>
  );
}

export default App;

```

页面效果如下：

![web](https://cdn.jsdelivr.net/gh/hicoldcat/assets@main/img/20220503192911.png)

合约创建者信息卡片会显示账户地址和私钥，以及当前账户剩余的以太币余额（注意：这个余额是本地网络启动时的默认余额，上文打印中也显示有1000ETH，交易过程中会消耗一定的gas，所以余额是1000ETH - 累计gas消耗的ETH），还有当前智能合约我们部署的Fool币数量。

此外，还有我们要转账的收款账户地址和转账Fool币数量。

接收者信息卡片展示的是接收者的账户地址和私钥。其实接收者私钥完全不需要展示出来，因为我们向接收者转账不需要知道接收者私钥，但这里为了直观，还是展示出来了。

点击*发币*按钮，就会发送转账交易。

![gif](https://cdn.jsdelivr.net/gh/hicoldcat/assets@main/img/demo.gif)

下方会监听交易信息，并打印出来交易数据。*点击transactionHash会显示该笔交易的详细信息弹窗如下*：

![tx](https://cdn.jsdelivr.net/gh/hicoldcat/assets@main/img/20220503193814.png)

同时，在我们运行的本地网络节点中，也会收到查询和交易的相关信息：

![](https://cdn.jsdelivr.net/gh/hicoldcat/assets@main/img/20220503194119.png)

![](https://cdn.jsdelivr.net/gh/hicoldcat/assets@main/img/20220503194159.png)


## 8、总结

*注意：每次启动项目需要重新部署合约，并且需要更新一下web目录下面的.env下面的合约地址！如果修改了合约内容，需要重新编译合约，并且将编译的文件夹/artifacts/contracts/Fool.sol/Fool.json文件拷贝到/web/src/artifacts/Fool.json!*

本次Example简单演示了如何部署一个自己的代币合约到本地网络，并通过开发基于react的Dapp页面，实现代币的发送和交易信息查看。

区块链基础知识推荐北大肖臻教授的[《区块链技术与应用》](http://zhenxiao.com/blockchain/)。

此外，也可以在github上查找更多相关的Repository ，比如[https://github.com/frankiefab100/Blockchain-Development-Resources](https://github.com/frankiefab100/Blockchain-Development-Resources)。

之后，如果有需求，我也会再写一些NFT相关的DEMO，和更复杂的合约。


![](https://cdn.jsdelivr.net/gh/hicoldcat/assets@main/img/my.png)
