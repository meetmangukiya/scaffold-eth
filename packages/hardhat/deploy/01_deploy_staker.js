module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const exampleExternalContract = await deployments.get(
    "ExampleExternalContract"
  );
  const now = new Date();
  const fiveDays = 5 * 24 * 60 * 60 * 1000;
  const deadlineSeconds = Math.ceil((now.getTime() + fiveDays) / 1000);
  await deploy("Staker", {
    from: deployer,
    args: [exampleExternalContract.address, deadlineSeconds, 10 ** 15],
    log: true,
  });
};

module.exports.tags = ["Staker"];
