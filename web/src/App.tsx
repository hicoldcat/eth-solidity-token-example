import { useEffect, useState } from 'react';
import './App.css';
import { ethers } from 'ethers';
import { Button, Card, Col, Input, InputNumber, Layout, Modal, Row, Spin } from 'antd';
import FoolToken from './artifacts/Fool.json';
import ReactJson from 'react-json-view'

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

  // const [logs, setLogs] = useState<any>({})
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

  // const onProviderListerner = (result: any) => {
  //   if (!logs[result?.transactionHash]) {
  //     setLogs({ ...logs, [result?.transactionHash]: result })
  //   }
  // }

  useEffect(() => {
    refetch()
    // provider.on({
    //   address: REACT_APP_CONTARCT_ADDRESS,
    //   topics: [
    //     ethers.utils.id("Transfer(address,address,uint256)")
    //   ]
    // }, onProviderListerner);
    contractWithSigner.on('Transfer', onContractTransfer)
    return () => {
      // provider.removeAllListeners()
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
          {/* <Card className='message' title="交易日志" style={{ overflowY: "auto" }}>
            <ReactJson src={Object.values(logs)} collapsed />
          </Card> */}

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
