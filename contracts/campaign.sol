/**
 *Submitted for verification at BscScan.com on 2023-08-24
*/

//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.19;

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
        treasory = 0xCA6C8E85804d7dC2CA7EcA018de77Aa2Ab8bE52C;
        oracle = 0x72d0b60e31dFfbe31c42B926C9d3d4674098294e;
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

    struct AdPool {
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
        uint64 participationLimit; // Optional property to limit number of participation by influencer default value is 0
    }

    struct Fund {
        address token;
        uint256 amount;
    }

    struct PostStatistics {
        bytes32 idProm; // Hash of the associated prom (from SocialMediaPostData)
        uint64 likes; // Number of likes
        uint64 shares; // Number of shares
        uint64 views; // Number of views
    }

    struct SocialMediaPostData {
        address influencer; // Address of the influencer who posted
        bytes32 idCampaign; // Hash of the campaign associated with the post
        bool isAccepted;    // Flag indicating if the post is accepted
        bool isPayed;
        Fund funds;
        uint8 typeSN; // Type of social network (e.g., Twitter, Instagram, LinkedIn,Tiktok,Facebook)
        uint256 appliedDate;  // Timestamp of when the post was applied
        uint64 abosNumber;  // Number of followers/subscribers
        string idPost;  // Timestamp of the last result harvest
        string idUser;
        uint64 nbResults;
        mapping(uint64 => bytes32) results;
        bytes32 prevResult;
        uint256 lastHarvest;  // Timestamp of the last result harvest
        uint256 validate;
    }

    mapping(bytes32 => AdPool) public campaigns;
    mapping(bytes32 => SocialMediaPostData) public proms;
    mapping(bytes32 => PostStatistics) public results;
    mapping(bytes32 => bool) public isAlreadyUsed;
    mapping(bytes32 => mapping(address => uint64)) public influencerProms;


    event CampaignCreated(
        bytes32 indexed id,
        uint64 startDate,
        uint64 endDate,
        string dataUrl,
        uint64  limit
    );
    event CampaignFundsSpent(bytes32 indexed id);
    event CampaignApplied(bytes32 indexed id, bytes32 indexed prom);
    event PromAccepted(bytes32 indexed id);
    event PromPayed(bytes32 indexed id, uint256 amount);
    event CampaignFunded(bytes32 indexed id, uint256 amount);
    
    modifier onlyInfluencer(bytes32 idProm) {
    require(proms[idProm].influencer == msg.sender, "Only influencer can call this function");
    _;
}

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

        if (token == 0x6fAc729f346A46fC0093126f237b4A520c40eb89) {
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
        uint256 amount,
        uint64 limit
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
        AdPool storage campaignData = campaigns[campaignId];
        campaignData.advertiser = msg.sender;
        campaignData.dataUrl = dataUrl;
        campaignData.startDate = startDate;
        campaignData.endDate = endDate;
        campaignData.participationLimit = limit;
        campaignData.nbProms = 0;
        campaignData.nbValidProms = 0;
        campaignData.funds = Fund(address(0), 0);
        //campaigns[campaignId] = AdPool(msg.sender,dataUrl,startDate,endDate,0,0,Fund(address(0),0));
        emit CampaignCreated(campaignId, startDate, endDate, dataUrl,limit);

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
        uint256 amount,
         uint64 limit
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
        AdPool storage campaignData = campaigns[campaignId];
        campaignData.advertiser = msg.sender;
        campaignData.dataUrl = dataUrl;
        campaignData.startDate = startDate;
        campaignData.endDate = endDate;
        campaignData.participationLimit = limit;
        campaignData.nbProms = 0;
        campaignData.nbValidProms = 0;
        campaignData.funds = Fund(address(0), 0);
        for (uint256 i = 0; i < bounties.length; i = i + 4) {
            campaignData.bounties.push(
                bountyUnit(
                    bounties[i],
                    bounties[i + 1],
                    bounties[i + 2],
                    bounties[i + 3]
                )
            );
        }

        emit CampaignCreated(campaignId, startDate, endDate, dataUrl, limit);

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
  
    function incrementPromotionCount(bytes32 idCampaign, address ownerLink) internal {
      influencerProms[idCampaign][ownerLink]++;
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
        AdPool storage campaignData = campaigns[idCampaign];
        require(campaignData.endDate > block.timestamp, "campaign ended");
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

        // Ensure the promotion link has not been used before
        require(!isAlreadyUsed[prom], "link already sent");

        // Get the current number of promotions used by the influencer for this campaign
       uint64 influencerPromCount = influencerProms[idCampaign][ownerLink];
       require(influencerPromCount < campaignData.participationLimit, "Participation limit exceeded");

        SocialMediaPostData storage post = proms[prom];
        post.influencer = ownerLink;
        post.idCampaign = idCampaign;
        post.isAccepted = true;
        post.funds = Fund(address(0), 0);
        post.typeSN = typeSN;
        post.idPost = idPost;
        post.idUser = idUser;
        post.abosNumber = abosNumber;
        post.nbResults = 0;
        post.prevResult = 0;
        post.validate = block.timestamp;
        campaignData.nbValidProms++;
        
        // Increment the influencer's promotion count for this campaign
        incrementPromotionCount(idCampaign, ownerLink);

        emit PromAccepted(prom);
    }

    function updateCampaignStats(bytes32 idCampaign) public notPaused {
        AdPool storage campaignData = campaigns[idCampaign];

        for (uint64 i = 0; i < campaignData.nbProms; i++) {
            bytes32 idProm = campaignData.proms[i];
            // Retrieve the post element associated with the given idProm from the proms mapping
            SocialMediaPostData storage post = proms[idProm];

            if (post.isAccepted) {
                bytes32 idRequest = keccak256(
                    abi.encodePacked(
                        post.typeSN,
                        post.idPost,
                        post.idUser,
                        block.timestamp
                    )
                );
                results[idRequest] = PostStatistics(idProm, 0, 0, 0);
                post.results[post.nbResults++] = idRequest;
                ask(
                    post.typeSN,
                    post.idPost,
                    post.idUser,
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
        SocialMediaPostData storage post = proms[idProm]; // Store the post element for efficient access

        require(post.isAccepted, "link not validated");
        bytes32 idRequest = keccak256(
            abi.encodePacked(
                post.typeSN,
                post.idPost,
                post.idUser,
                block.timestamp
            )
        );
        results[idRequest] = PostStatistics(idProm, 0, 0, 0);
        post.results[post.nbResults++] = idRequest;
        ask(
            post.typeSN,
            post.idPost,
            post.idUser,
            idRequest
        );
        return idRequest;
    }

    function updateBounty(bytes32 idProm) public notPaused {
        SocialMediaPostData storage post = proms[idProm]; // Store the post element for efficient access
        require(post.isAccepted, "link not validated");
        askBounty(
            post.typeSN,
            post.idPost,
            post.idUser,
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

/**
 * @dev Updates the bounty payment status for a specific campaign promotion (idProm).
 * The function calculates the gain for the influencer based on the number of subscribers (nbAbos) and campaign bounties.
 * If the gain is sufficient, the payment is processed, otherwise, the funds are added to the promotion's balance.
 * @param idProm The unique identifier of the campaign promotion.
 * @param nbAbos The number of subscribers for the promotion.
 * @return ok True if the operation is successful.
 */
    function updateBounty(bytes32 idProm, uint256 nbAbos)
        external notPaused
        returns (bool ok)
    {
        require(msg.sender == oracle, "oracle mismatch");
        
        // Store the prom element for efficient access
        SocialMediaPostData storage post = proms[idProm];
        require(!post.isPayed, "link already paid");
        post.isPayed = true;
         // Store the campaign element for efficient access
        AdPool storage campaignData = campaigns[post.idCampaign];
        
        post.funds.token = campaignData.funds.token;

        uint256 gain = 0;
        for (
            uint256 i = 0;
            i < campaignData.bounties.length;
            i++
        ) {
            if (
                nbAbos >= campaignData.bounties[i].minRange &&
                nbAbos < campaignData.bounties[i].maxRange &&
                post.typeSN == campaignData.bounties[i].typeSN
            ) {
                gain = campaignData.bounties[i].amount;
            }
        }

        if (campaignData.funds.amount <= gain) {
            //campaignData.endDate = uint64(block.timestamp);
            post.funds.amount += campaignData.funds.amount;
            campaignData.funds.amount = 0;
            emit CampaignFundsSpent(post.idCampaign);
            return true;
        }
        campaignData.funds.amount -= gain;
        post.funds.amount += gain;
        return true;
    }

    function update(
        bytes32 idRequest,
        uint64 likes,
        uint64 shares,
        uint64 views
    ) external notPaused returns (bool ok) {
        require(msg.sender == oracle, "oracle mismatch");

        SocialMediaPostData storage post = proms[results[idRequest].idProm];

        results[idRequest].likes = likes;
        results[idRequest].shares = shares;
        results[idRequest].views = views;

        uint256 gain = 0;

        if (likes > results[post.prevResult].likes)
            gain +=
                (likes - results[post.prevResult].likes) *
                campaigns[post.idCampaign].ratios[post.typeSN].likeRatio;
        if (shares > results[post.prevResult].shares)
            gain +=
                (shares - results[post.prevResult].shares) *
                campaigns[post.idCampaign].ratios[post.typeSN].shareRatio;
        if (views > results[post.prevResult].views)
            gain +=
                (views - results[post.prevResult].views) *
                campaigns[post.idCampaign].ratios[post.typeSN].viewRatio;
        post.prevResult = idRequest;

        //
        // warn campaign low credits
        //

        if (post.funds.token == address(0)) {
            post.funds.token = campaigns[post.idCampaign].funds.token;
        }
        if (campaigns[post.idCampaign].funds.amount <= gain) {
            //campaigns[post.idCampaign].endDate = uint64(block.timestamp);
            post.funds.amount += campaigns[post.idCampaign].funds.amount;
            campaigns[post.idCampaign].funds.amount = 0;
            emit CampaignFundsSpent(post.idCampaign);
            return true;
        }
        campaigns[post.idCampaign].funds.amount -= gain;
        post.funds.amount += gain;
        return true;
    }

    function getGains(bytes32 idProm) public notPaused onlyInfluencer(idProm) {
        SocialMediaPostData storage post = proms[idProm];
        require(post.influencer == msg.sender, "link owner mismatch");

        AdPool storage campaignData = campaigns[post.idCampaign];
         // Check if the campaign is a bounty campaign
       if (campaignData.bounties.length > 0) {
         require(campaignData.endDate < block.timestamp, "Bounty campaign has not ended yet");
       }

        uint256 diff = block.timestamp - post.appliedDate;
        require(diff > 300, "less than 15min");

        require(
            block.timestamp - post.lastHarvest > 300,
            "less than 15min to harvest again"
        );

        IBEP20 erc20 = IBEP20(post.funds.token);
        uint256 amount = post.funds.amount;
        post.funds.amount = 0;
        post.lastHarvest = block.timestamp;
        erc20.transfer(post.influencer, amount);

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
            block.timestamp - campaigns[idCampaign].endDate > 300,
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

/**
 * @dev Retrieves various ratios and limits associated with a campaign.
 * @param idCampaign The unique identifier of the campaign.
 * @return types An array of promotion types.
 * @return likeRatios An array of like ratios for each promotion type.
 * @return shareRatios An array of share ratios for each promotion type.
 * @return viewRatios An array of view ratios for each promotion type.
 * @return limits An array of reach limits for each promotion type.
 */
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

        // Store the campaign element for efficient access
        AdPool storage campaignData = campaigns[idCampaign];

        uint8 l = 10;
        types = new uint8[](l);
        likeRatios = new uint256[](l);
        shareRatios = new uint256[](l);
        viewRatios = new uint256[](l);
        limits = new uint256[](l);
        for (uint8 i = 0; i < l; i++) {
            types[i] = i + 1;
            likeRatios[i] = campaignData.ratios[i + 1].likeRatio;
            shareRatios[i] = campaignData.ratios[i + 1].shareRatio;
            viewRatios[i] = campaignData.ratios[i + 1].viewRatio;
            limits[i] = campaignData.ratios[i + 1].reachLimit;
        }
        return (types, likeRatios, shareRatios, viewRatios, limits);
    }

/**
 * @dev Retrieves bounty details for a campaign.
 * @param idCampaign The unique identifier of the campaign.
 * @return bounty An array containing minRange, maxRange, typeSN, and amount for each bounty.
 */
    function getBounties(bytes32 idCampaign)
        public notPaused
        view
        returns (uint256[] memory bounty)
    {

    AdPool storage campaignData = campaigns[idCampaign];
    uint256 bountyCount = campaignData.bounties.length;
    bounty = new uint256[](bountyCount * 4);
    
        for (uint8 i = 0; i < bountyCount; i++) {
            bounty[i * 4] = campaignData.bounties[i].minRange;
            bounty[i * 4 + 1] = campaignData.bounties[i].maxRange;
            bounty[i * 4 + 2] = campaignData.bounties[i].typeSN;
            bounty[i * 4 + 3] = campaignData.bounties[i].amount;
        }
        return bounty;
    }

    function getResults(bytes32 idProm)
        public notPaused
        view
        returns (bytes32[] memory creq)
    {
        SocialMediaPostData storage post = proms[idProm];
        uint256 nbResults = post.nbResults;
        creq = new bytes32[](nbResults);
        for (uint64 i = 0; i < nbResults; i++) {
            creq[i] = post.results[i];
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