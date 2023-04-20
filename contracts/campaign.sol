//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.17;

abstract contract owned {
    address payable public owner;
    address public treasory;
    address public oracle;
    bool public paused;

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only contract owner can call this function"
        );
        _;
    }

    modifier notPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    function pause() public onlyOwner{
        paused = true;
    }

    function unpause() public onlyOwner {
        paused = false;
    }

    constructor() {
        owner = payable(msg.sender);
        treasory = 0x75e6ef3113266F7116B219f05Caede20889ddDf3;
        oracle = 0xd99884038A064466961bB0CE6e32646abD11bA9B;
    }

    function transferOwnership(address payable newOwner) public notPaused onlyOwner {
        owner = newOwner;
    }

    function transferTreasoryOwnership(address payable newTreasory)
        public
        notPaused
        onlyOwner
    {
        treasory = newTreasory;
    }
}

interface IBEP20 {
    function transfer(address _to, uint256 _value) external returns (bool);

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external returns (bool);

    function balanceOf(address _owner) external view returns (uint256);
}

abstract contract ERC20Holder is owned {
    mapping(address => bool) public acceptedTokens;

    function modToken(address token, bool accepted) public notPaused onlyOwner {
        acceptedTokens[token] = accepted;
    }

    receive() external payable {
        // Accept all incoming tokens
    }

    // a function to receive BEP20 tokens
    function receiveToken(address token, uint256 amount) public notPaused {
        require(acceptedTokens[token], "Token not accepted");
        require(
            IBEP20(token).transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
    }
}

contract oracleClient is ERC20Holder {
    function setOracle(address a) public notPaused onlyOwner {
        oracle = a;
    }
}

interface IOracle {
    function ask(
        uint8 typeSN,
        string calldata idPost,
        string calldata idUser,
        bytes32 idRequest
    ) external;

    function askBounty(
        uint8 typeSN,
        string calldata idPost,
        string calldata idUser,
        bytes32 idProm
    ) external;
}

contract campaign is oracleClient {

    struct cpRatio {
        uint256 likeRatio;
        uint256 shareRatio;
        uint256 viewRatio;
        uint256 reachLimit;
    }

    struct bountyUnit {
        uint256 minRange;
        uint256 maxRange;
        uint256 typeSN;
        uint256 amount;
    }

    struct Campaign {
        address advertiser;
        string dataUrl;
        uint64 startDate;
        uint64 endDate;
        uint64 nbProms;
        uint64 nbValidProms;
        mapping(uint64 => bytes32) proms;
        Fund funds;
        mapping(uint8 => cpRatio) ratios;
        bountyUnit[] bounties;
    }

    struct Fund {
        address token;
        uint256 amount;
    }

    struct Result {
        bytes32 idProm;
        uint64 likes;
        uint64 shares;
        uint64 views;
    }

    struct promElement {
        address influencer;
        bytes32 idCampaign;
        bool isAccepted;
        bool isPayed;
        Fund funds;
        uint8 typeSN;
        uint256 appliedDate;
        uint64 abosNumber;
        string idPost;
        string idUser;
        uint64 nbResults;
        mapping(uint64 => bytes32) results;
        bytes32 prevResult;
        uint256 lastHarvest;
        uint256 validate;
    }

    mapping(bytes32 => Campaign) public campaigns;
    mapping(bytes32 => promElement) public proms;
    mapping(bytes32 => Result) public results;
    mapping(bytes32 => bool) public isAlreadyUsed;

    event CampaignCreated(
        bytes32 indexed id,
        uint64 startDate,
        uint64 endDate,
        string dataUrl
    );
    event CampaignFundsSpent(bytes32 indexed id);
    event CampaignApplied(bytes32 indexed id, bytes32 indexed prom);
    event PromAccepted(bytes32 indexed id);
    event PromPayed(bytes32 indexed id, uint256 amount);
    event CampaignFunded(bytes32 indexed id, uint256 amount);

    function priceRatioCampaign(
        bytes32 idCampaign,
        uint8 typeSN,
        uint256 likeRatio,
        uint256 shareRatio,
        uint256 viewRatio,
        uint256 limit
    ) internal notPaused {
        require(
            campaigns[idCampaign].advertiser == msg.sender,
            "campaign owner mismatch"
        );
        campaigns[idCampaign].ratios[typeSN] = cpRatio(
            likeRatio,
            shareRatio,
            viewRatio,
            limit
        );
    }

    function fundCampaign(
        bytes32 idCampaign,
        address token,
        uint256 amount
    ) public notPaused {
        require(
            campaigns[idCampaign].endDate > block.timestamp,
            "campaign ended"
        );
        require(
            campaigns[idCampaign].funds.token == address(0) ||
                campaigns[idCampaign].funds.token == token,
            "token mismatch"
        );

        IBEP20 erc20 = IBEP20(token);
        uint256 prev_amount = campaigns[idCampaign].funds.amount;
        uint256 added_amount;
        uint256 trisory_amount;

        if (token == 0x448bee2d93be708b54ee6353a7cc35c4933f1156) {
            added_amount = (amount * 95) / 100;
            trisory_amount = amount - added_amount;
        } else {
            added_amount = (amount * 85) / 100;
            trisory_amount = amount - added_amount;
        }

        erc20.transferFrom(msg.sender, treasory, trisory_amount);
        erc20.transferFrom(msg.sender, address(this), added_amount);

        campaigns[idCampaign].funds = Fund(token, added_amount + prev_amount);
        emit CampaignFunded(idCampaign, added_amount);
    }

    function createPriceFundAll(
        string memory dataUrl,
        uint64 startDate,
        uint64 endDate,
        uint256[] memory ratios,
        address token,
        uint256 amount
    ) public notPaused returns (bytes32 idCampaign) {
        require(endDate > block.timestamp, "end date too early");
        require(endDate > startDate, "end date early than start");

        bytes32 campaignId = keccak256(
            abi.encodePacked(
                msg.sender,
                dataUrl,
                startDate,
                endDate,
                block.timestamp
            )
        );
        Campaign storage c = campaigns[campaignId];
        c.advertiser = msg.sender;
        c.dataUrl = dataUrl;
        c.startDate = startDate;
        c.endDate = endDate;
        c.nbProms = 0;
        c.nbValidProms = 0;
        c.funds = Fund(address(0), 0);
        //campaigns[campaignId] = Campaign(msg.sender,dataUrl,startDate,endDate,0,0,Fund(address(0),0));
        emit CampaignCreated(campaignId, startDate, endDate, dataUrl);

        for (uint8 i = 0; i < ratios.length; i = i + 4) {
            priceRatioCampaign(
                campaignId,
                (i / 4) + 1,
                ratios[i],
                ratios[i + 1],
                ratios[i + 2],
                ratios[i + 3]
            );
        }

        fundCampaign(campaignId, token, amount);
        return campaignId;
    }

    function createPriceFundBounty(
        string memory dataUrl,
        uint64 startDate,
        uint64 endDate,
        uint256[] memory bounties,
        address token,
        uint256 amount
    ) public notPaused returns (bytes32 idCampaign) {
        require(endDate > block.timestamp, "end date too early");
        require(endDate > startDate, "end date early than start");

        bytes32 campaignId = keccak256(
            abi.encodePacked(
                msg.sender,
                dataUrl,
                startDate,
                endDate,
                block.timestamp
            )
        );
        Campaign storage c = campaigns[campaignId];
        c.advertiser = msg.sender;
        c.dataUrl = dataUrl;
        c.startDate = startDate;
        c.endDate = endDate;
        c.nbProms = 0;
        c.nbValidProms = 0;
        c.funds = Fund(address(0), 0);
        for (uint256 i = 0; i < bounties.length; i = i + 4) {
            c.bounties.push(
                bountyUnit(
                    bounties[i],
                    bounties[i + 1],
                    bounties[i + 2],
                    bounties[i + 3]
                )
            );
        }

        emit CampaignCreated(campaignId, startDate, endDate, dataUrl);

        fundCampaign(campaignId, token, amount);
        return campaignId;
    }

    function VerifyMessage(
        bytes32 _hashedMessage,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public notPaused view  returns (address) {
        //bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        //bytes32 prefixedHashMessage = keccak256(abi.encodePacked(prefix, _hashedMessage));

        address signer = ecrecover(_hashedMessage, _v, _r, _s);
        return signer;
    }

    function validateProm(
        bytes32 idCampaign,
        uint8 typeSN,
        string memory idPost,
        string memory idUser,
        uint64 abosNumber,
        address ownerLink,
        bytes32 _hashedMessage,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public notPaused {
        Campaign storage cmp = campaigns[idCampaign];
        require(cmp.endDate > block.timestamp, "campaign ended");
        address signer = VerifyMessage(_hashedMessage, _v, _r, _s);
        require(signer == ownerLink, "campaign applayer is mismatch");
        bytes32 prom = keccak256(
            abi.encodePacked(
                idCampaign,
                typeSN,
                idPost,
                idUser,
                ownerLink,
                block.timestamp
            )
        );
        require(!isAlreadyUsed[prom], "link already sent");
        promElement storage p = proms[prom];
        p.influencer = ownerLink;
        p.idCampaign = idCampaign;
        p.isAccepted = true;
        p.funds = Fund(address(0), 0);
        p.typeSN = typeSN;
        p.idPost = idPost;
        p.idUser = idUser;
        p.abosNumber = abosNumber;
        p.nbResults = 0;
        p.prevResult = 0;
        p.validate = block.timestamp;
        cmp.nbValidProms++;

        emit PromAccepted(prom);
    }

    function updateCampaignStats(bytes32 idCampaign) public notPaused {
        for (uint64 i = 0; i < campaigns[idCampaign].nbProms; i++) {
            bytes32 idProm = campaigns[idCampaign].proms[i];
            if (proms[idProm].isAccepted) {
                bytes32 idRequest = keccak256(
                    abi.encodePacked(
                        proms[idProm].typeSN,
                        proms[idProm].idPost,
                        proms[idProm].idUser,
                        block.timestamp
                    )
                );
                results[idRequest] = Result(idProm, 0, 0, 0);
                proms[idProm].results[proms[idProm].nbResults++] = idRequest;
                ask(
                    proms[idProm].typeSN,
                    proms[idProm].idPost,
                    proms[idProm].idUser,
                    idRequest
                );
            }
        }
    }

    function updatePromStats(bytes32 idProm)
        public
        notPaused
        returns (bytes32 requestId)
    {
        require(proms[idProm].isAccepted, "link not validated");
        bytes32 idRequest = keccak256(
            abi.encodePacked(
                proms[idProm].typeSN,
                proms[idProm].idPost,
                proms[idProm].idUser,
                block.timestamp
            )
        );
        results[idRequest] = Result(idProm, 0, 0, 0);
        proms[idProm].results[proms[idProm].nbResults++] = idRequest;
        ask(
            proms[idProm].typeSN,
            proms[idProm].idPost,
            proms[idProm].idUser,
            idRequest
        );
        return idRequest;
    }

    function updateBounty(bytes32 idProm) public notPaused {
        require(proms[idProm].isAccepted, "link not validated");
        askBounty(
            proms[idProm].typeSN,
            proms[idProm].idPost,
            proms[idProm].idUser,
            idProm
        );
    }

    function ask(
        uint8 typeSN,
        string memory idPost,
        string memory idUser,
        bytes32 idRequest
    ) public notPaused {
        IOracle o = IOracle(oracle);
        o.ask(typeSN, idPost, idUser, idRequest);
    }

    function askBounty(
        uint8 typeSN,
        string memory idPost,
        string memory idUser,
        bytes32 idProm
    ) public notPaused {
        IOracle o = IOracle(oracle);
        o.askBounty(typeSN, idPost, idUser, idProm);
    }

    function updateBounty(bytes32 idProm, uint256 nbAbos)
        external notPaused
        returns (bool ok)
    {
        require(msg.sender == oracle, "oracle mismatch");

        promElement storage prom = proms[idProm];
        require(!prom.isPayed, "link already paid");
        prom.isPayed = true;
        prom.funds.token = campaigns[prom.idCampaign].funds.token;

        uint256 gain = 0;
        for (
            uint256 i = 0;
            i < campaigns[prom.idCampaign].bounties.length;
            i++
        ) {
            if (
                nbAbos >= campaigns[prom.idCampaign].bounties[i].minRange &&
                nbAbos < campaigns[prom.idCampaign].bounties[i].maxRange &&
                prom.typeSN == campaigns[prom.idCampaign].bounties[i].typeSN
            ) {
                gain = campaigns[prom.idCampaign].bounties[i].amount;
            }
        }

        if (campaigns[prom.idCampaign].funds.amount <= gain) {
            //campaigns[prom.idCampaign].endDate = uint64(block.timestamp);
            prom.funds.amount += campaigns[prom.idCampaign].funds.amount;
            campaigns[prom.idCampaign].funds.amount = 0;
            emit CampaignFundsSpent(prom.idCampaign);
            return true;
        }
        campaigns[prom.idCampaign].funds.amount -= gain;
        prom.funds.amount += gain;
        return true;
    }

    function update(
        bytes32 idRequest,
        uint64 likes,
        uint64 shares,
        uint64 views
    ) external notPaused returns (bool ok) {
        require(msg.sender == oracle, "oracle mismatch");

        promElement storage prom = proms[results[idRequest].idProm];

        results[idRequest].likes = likes;
        results[idRequest].shares = shares;
        results[idRequest].views = views;

        uint256 gain = 0;

        if (likes > results[prom.prevResult].likes)
            gain +=
                (likes - results[prom.prevResult].likes) *
                campaigns[prom.idCampaign].ratios[prom.typeSN].likeRatio;
        if (shares > results[prom.prevResult].shares)
            gain +=
                (shares - results[prom.prevResult].shares) *
                campaigns[prom.idCampaign].ratios[prom.typeSN].shareRatio;
        if (views > results[prom.prevResult].views)
            gain +=
                (views - results[prom.prevResult].views) *
                campaigns[prom.idCampaign].ratios[prom.typeSN].viewRatio;
        prom.prevResult = idRequest;

        //
        // warn campaign low credits
        //

        if (prom.funds.token == address(0)) {
            prom.funds.token = campaigns[prom.idCampaign].funds.token;
        }
        if (campaigns[prom.idCampaign].funds.amount <= gain) {
            //campaigns[prom.idCampaign].endDate = uint64(block.timestamp);
            prom.funds.amount += campaigns[prom.idCampaign].funds.amount;
            campaigns[prom.idCampaign].funds.amount = 0;
            emit CampaignFundsSpent(prom.idCampaign);
            return true;
        }
        campaigns[prom.idCampaign].funds.amount -= gain;
        prom.funds.amount += gain;
        return true;
    }

    function getGains(bytes32 idProm) public notPaused {
        require(proms[idProm].influencer == msg.sender, "link owner mismatch");
        uint256 diff = block.timestamp - proms[idProm].appliedDate;
        require(diff > 86400, "less than 24h");

        require(
            block.timestamp - proms[idProm].lastHarvest > 86400,
            "less than 24h to harvest again"
        );

        IBEP20 erc20 = IBEP20(proms[idProm].funds.token);
        uint256 amount = proms[idProm].funds.amount;
        proms[idProm].funds.amount = 0;
        proms[idProm].lastHarvest = block.timestamp;
        erc20.transfer(proms[idProm].influencer, amount);

        emit PromPayed(idProm, amount);
    }

    function getRemainingFunds(bytes32 idCampaign) public notPaused {
        require(
            campaigns[idCampaign].advertiser == msg.sender,
            "campaign owner mismatch"
        );
        require(
            campaigns[idCampaign].endDate < block.timestamp,
            "campaign not ended"
        );
        require(
            block.timestamp - campaigns[idCampaign].endDate > 1296000,
            "Withdraw not allowed under 15 days"
        );

        IBEP20 erc20 = IBEP20(campaigns[idCampaign].funds.token);
        uint256 amount = campaigns[idCampaign].funds.amount;
        campaigns[idCampaign].funds.amount = 0;
        erc20.transfer(campaigns[idCampaign].advertiser, amount);
    }

    function getProms(bytes32 idCampaign)
        public notPaused
        view
        returns (bytes32[] memory cproms)
    {
        uint256 nbProms = campaigns[idCampaign].nbProms;
        cproms = new bytes32[](nbProms);

        for (uint64 i = 0; i < nbProms; i++) {
            cproms[i] = campaigns[idCampaign].proms[i];
        }
        return cproms;
    }

    function getRatios(bytes32 idCampaign)
        public notPaused
        view
        returns (
            uint8[] memory types,
            uint256[] memory likeRatios,
            uint256[] memory shareRatios,
            uint256[] memory viewRatios,
            uint256[] memory limits
        )
    {
        uint8 l = 10;
        types = new uint8[](l);
        likeRatios = new uint256[](l);
        shareRatios = new uint256[](l);
        viewRatios = new uint256[](l);
        limits = new uint256[](l);
        for (uint8 i = 0; i < l; i++) {
            types[i] = i + 1;
            likeRatios[i] = campaigns[idCampaign].ratios[i + 1].likeRatio;
            shareRatios[i] = campaigns[idCampaign].ratios[i + 1].shareRatio;
            viewRatios[i] = campaigns[idCampaign].ratios[i + 1].viewRatio;
            limits[i] = campaigns[idCampaign].ratios[i + 1].reachLimit;
        }
        return (types, likeRatios, shareRatios, viewRatios, limits);
    }

    function getBounties(bytes32 idCampaign)
        public notPaused
        view
        returns (uint256[] memory bounty)
    {
        bounty = new uint256[](campaigns[idCampaign].bounties.length * 4);
        for (uint8 i = 0; i < campaigns[idCampaign].bounties.length; i++) {
            bounty[i * 4] = campaigns[idCampaign].bounties[i].minRange;
            bounty[i * 4 + 1] = campaigns[idCampaign].bounties[i].maxRange;
            bounty[i * 4 + 2] = campaigns[idCampaign].bounties[i].typeSN;
            bounty[i * 4 + 3] = campaigns[idCampaign].bounties[i].amount;
        }
        return bounty;
    }

    function getResults(bytes32 idProm)
        public notPaused
        view
        returns (bytes32[] memory creq)
    {
        uint256 nbResults = proms[idProm].nbResults;
        creq = new bytes32[](nbResults);
        for (uint64 i = 0; i < nbResults; i++) {
            creq[i] = proms[idProm].results[i];
        }
        return creq;
    }

    function getIsUsed(
        bytes32 idCampaign,
        uint8 typeSN,
        string memory idPost,
        string memory idUser
    ) public notPaused view returns (bool) {
        bytes32 prom = keccak256(
            abi.encodePacked(idCampaign, typeSN, idPost, idUser)
        );
        return isAlreadyUsed[prom];
    }


}