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