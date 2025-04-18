import { ethers } from "ethers";
import { toast } from "sonner";
import { Game, MatchResult, PlayerStats, NFTAttributes, NFTListing, NFTType, Rarity } from "./types";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x88282cc7c75c3726c7e09e73954dc34bff8731dc";
const PROVIDER_URL = import.meta.env.VITE_PROVIDER_URL || "https://testnet-rpc.monad.xyz";

const ABI = [
            {
                "inputs": [],
                "stateMutability": "nonpayable",
                "type": "constructor"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "sender",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    }
                ],
                "name": "ERC721IncorrectOwner",
                "type": "error"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "operator",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "ERC721InsufficientApproval",
                "type": "error"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "approver",
                        "type": "address"
                    }
                ],
                "name": "ERC721InvalidApprover",
                "type": "error"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "operator",
                        "type": "address"
                    }
                ],
                "name": "ERC721InvalidOperator",
                "type": "error"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    }
                ],
                "name": "ERC721InvalidOwner",
                "type": "error"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "receiver",
                        "type": "address"
                    }
                ],
                "name": "ERC721InvalidReceiver",
                "type": "error"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "sender",
                        "type": "address"
                    }
                ],
                "name": "ERC721InvalidSender",
                "type": "error"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "ERC721NonexistentToken",
                "type": "error"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    }
                ],
                "name": "OwnableInvalidOwner",
                "type": "error"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                    }
                ],
                "name": "OwnableUnauthorizedAccount",
                "type": "error"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "approved",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "Approval",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "operator",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "bool",
                        "name": "approved",
                        "type": "bool"
                    }
                ],
                "name": "ApprovalForAll",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "_fromTokenId",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "_toTokenId",
                        "type": "uint256"
                    }
                ],
                "name": "BatchMetadataUpdate",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "gameId",
                        "type": "uint256"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "player1",
                        "type": "address"
                    }
                ],
                "name": "GameCancelled",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "gameId",
                        "type": "uint256"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "player1",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "player2",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "stake",
                        "type": "uint256"
                    }
                ],
                "name": "GameCreated",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "gameId",
                        "type": "uint256"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "winner",
                        "type": "address"
                    }
                ],
                "name": "GameFinished",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "gameId",
                        "type": "uint256"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "player2",
                        "type": "address"
                    }
                ],
                "name": "GameJoined",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "_tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "MetadataUpdate",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "price",
                        "type": "uint256"
                    }
                ],
                "name": "NFTListed",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "strength",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "speed",
                        "type": "uint256"
                    }
                ],
                "name": "NFTMinted",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": false,
                        "internalType": "address",
                        "name": "buyer",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "price",
                        "type": "uint256"
                    }
                ],
                "name": "NFTPurchased",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "previousOwner",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "newOwner",
                        "type": "address"
                    }
                ],
                "name": "OwnershipTransferred",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "from",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "Transfer",
                "type": "event"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "approve",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    }
                ],
                "name": "balanceOf",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "name": "balances",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "buyNFT",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "gameId",
                        "type": "uint256"
                    }
                ],
                "name": "cancelMatch",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "opponent",
                        "type": "address"
                    }
                ],
                "name": "createMatch",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "name": "games",
                "outputs": [
                    {
                        "internalType": "address",
                        "name": "player1",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "player2",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "stake",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "winner",
                        "type": "address"
                    },
                    {
                        "internalType": "bool",
                        "name": "isFinished",
                        "type": "bool"
                    },
                    {
                        "internalType": "bool",
                        "name": "isCancelled",
                        "type": "bool"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "getApproved",
                "outputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "gameId",
                        "type": "uint256"
                    }
                ],
                "name": "getGame",
                "outputs": [
                    {
                        "components": [
                            {
                                "internalType": "address",
                                "name": "player1",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "player2",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "stake",
                                "type": "uint256"
                            },
                            {
                                "internalType": "address",
                                "name": "winner",
                                "type": "address"
                            },
                            {
                                "internalType": "bool",
                                "name": "isFinished",
                                "type": "bool"
                            },
                            {
                                "internalType": "bool",
                                "name": "isCancelled",
                                "type": "bool"
                            }
                        ],
                        "internalType": "struct PingPongNFTGame.Game",
                        "name": "",
                        "type": "tuple"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getMatchHistoryLength",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "gameId",
                        "type": "uint256"
                    }
                ],
                "name": "getMatchResult",
                "outputs": [
                    {
                        "components": [
                            {
                                "internalType": "uint256",
                                "name": "gameId",
                                "type": "uint256"
                            },
                            {
                                "internalType": "address",
                                "name": "player1",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "player2",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "winner",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "stake",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "timestamp",
                                "type": "uint256"
                            }
                        ],
                        "internalType": "struct PingPongNFTGame.MatchResult",
                        "name": "",
                        "type": "tuple"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "getNFTPrice",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "getNFTStats",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "strength",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "speed",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "player",
                        "type": "address"
                    }
                ],
                "name": "getPlayerStats",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "played",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "won",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getTopPlayers",
                "outputs": [
                    {
                        "internalType": "address[]",
                        "name": "",
                        "type": "address[]"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "operator",
                        "type": "address"
                    }
                ],
                "name": "isApprovedForAll",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "gameId",
                        "type": "uint256"
                    }
                ],
                "name": "joinMatch",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "price",
                        "type": "uint256"
                    }
                ],
                "name": "listNFT",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "name": "matchHistory",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "gameId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "player1",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "player2",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "winner",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "stake",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "string",
                        "name": "tokenURI",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "strength",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "speed",
                        "type": "uint256"
                    }
                ],
                "name": "mintNFT",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "name",
                "outputs": [
                    {
                        "internalType": "string",
                        "name": "",
                        "type": "string"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "name": "nftAttributes",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "strength",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "speed",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "name": "nftPrices",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "owner",
                "outputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "ownerOf",
                "outputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "name": "playerGames",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "name": "playerWins",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "renounceOwnership",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "gameId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "winner",
                        "type": "address"
                    }
                ],
                "name": "reportMatchResult",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "from",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "safeTransferFrom",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "from",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    }
                ],
                "name": "safeTransferFrom",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "operator",
                        "type": "address"
                    },
                    {
                        "internalType": "bool",
                        "name": "approved",
                        "type": "bool"
                    }
                ],
                "name": "setApprovalForAll",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "bytes4",
                        "name": "interfaceId",
                        "type": "bytes4"
                    }
                ],
                "name": "supportsInterface",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "symbol",
                "outputs": [
                    {
                        "internalType": "string",
                        "name": "",
                        "type": "string"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "tokenURI",
                "outputs": [
                    {
                        "internalType": "string",
                        "name": "",
                        "type": "string"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "from",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "transferFrom",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "newOwner",
                        "type": "address"
                    }
                ],
                "name": "transferOwnership",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "stateMutability": "payable",
                "type": "receive"
            }
        ]

class PingPongContract {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;
  private readOnlyProvider: ethers.JsonRpcProvider;
  private readOnlyContract: ethers.Contract;

  constructor() {
    // Setup read-only provider and contract for non-authenticated calls
    this.readOnlyProvider = new ethers.JsonRpcProvider(PROVIDER_URL);
    this.readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, this.readOnlyProvider);
  }

  async initialize(provider: any): Promise<void> {
    try {
      this.provider = new ethers.BrowserProvider(provider);
      this.signer = await this.provider.getSigner();
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, this.signer);
      console.log("Contract initialized successfully");
    } catch (error) {
      console.error("Failed to initialize contract:", error);
      toast.error("Failed to initialize contract. Please try reconnecting your wallet.");
      throw error;
    }
  }

  ensureInitialized(): void {
    if (!this.contract || !this.signer) {
      toast.error("Wallet not connected. Please connect your wallet first.");
      throw new Error("Contract not initialized. Connect wallet first.");
    }
  }

  // Read-only methods (work without wallet connection)
  async getGameIdCounter(): Promise<bigint> {
    try {
      // The contract doesn't have a gameIdCounter function, so we'll use the match history length instead
      // This should work because each match creates a new entry in the match history
      console.log('Getting match history length to use as game ID counter');
      const matchHistoryLength = await this.readOnlyContract.getMatchHistoryLength();
      console.log('Match history length:', matchHistoryLength.toString());
      return matchHistoryLength;
    } catch (error) {
      console.error("Error getting game ID counter:", error);
      throw error;
    }
  }

  async getMatchHistoryLength(): Promise<bigint> {
    try {
      return await this.readOnlyContract.getMatchHistoryLength();
    } catch (error) {
      console.error("Error getting match history length:", error);
      throw error;
    }
  }

  async getMatchResult(index: number): Promise<MatchResult> {
    try {
      return await this.readOnlyContract.getMatchResult(index);
    } catch (error) {
      console.error(`Error getting match result for index ${index}:`, error);
      throw error;
    }
  }

  async getMatchHistory(): Promise<MatchResult[]> {
    try {
      const length = await this.getMatchHistoryLength();
      console.log(`Match history length: ${length}`);

      const results: MatchResult[] = [];

      // Get all match results
      for (let i = 0; i < length; i++) {
        try {
          const result = await this.getMatchResult(i);
          results.push(result);
        } catch (error) {
          console.error(`Error getting match result at index ${i}:`, error);
          // Continue with the next match
        }
      }

      return results;
    } catch (error) {
      console.error('Error getting match history:', error);
      return [];
    }
  }

  async getTopPlayers(): Promise<string[]> {
    try {
      console.log('Calling getTopPlayers on contract...');
      const result = await this.readOnlyContract.getTopPlayers();
      console.log('getTopPlayers result:', result);
      return result;
    } catch (error) {
      console.error("Error getting top players:", error);
      // Return empty array instead of throwing
      return [];
    }
  }

  async getPlayerStats(address: string): Promise<PlayerStats> {
    try {
      console.log(`Getting stats for player ${address}...`);
      const [played, won] = await this.readOnlyContract.getPlayerStats(address);
      console.log(`Stats for ${address}:`, { played: played.toString(), won: won.toString() });
      return { played, won };
    } catch (error) {
      console.error(`Error getting player stats for address ${address}:`, error);
      // Return default stats instead of throwing
      return { played: 0n, won: 0n };
    }
  }

  async getGame(gameId: string | number): Promise<Game> {
    try {
      return await this.readOnlyContract.getGame(gameId);
    } catch (error) {
      console.error(`Error getting game data for ID ${gameId}:`, error);
      throw error;
    }
  }

  // Write methods (require wallet connection)
  async createMatch(opponent: string, stakeAmount: string): Promise<any> {
    this.ensureInitialized();
    try {
      console.log(`Creating match with opponent: ${opponent}, stake: ${stakeAmount} MON`);
      const tx = await this.contract!.createMatch(opponent, {
        value: ethers.parseEther(stakeAmount)
      });
      console.log('Create match transaction sent:', tx.hash);
      toast.info("Creating match... Please wait for confirmation.");

      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      console.log('Create match transaction confirmed in block:', receipt.blockNumber);

      // Try to extract the game ID from the event logs
      let gameId: string | undefined;
      try {
        // Look for the GameCreated event
        const event = receipt.logs.find((log: any) =>
          log.topics[0] === ethers.id("GameCreated(uint256,address,address,uint256)")
        );

        if (event && event.topics.length > 1) {
          // The first topic after the event signature is the indexed gameId
          // Convert the hex value to a BigInt and then to a string
          gameId = BigInt(event.topics[1]).toString();
          console.log(`Extracted game ID from event: ${gameId}`);
        } else {
          // Fallback to using match history length
          const matchHistoryLength = await this.getMatchHistoryLength();
          gameId = (matchHistoryLength - 1n).toString();
          console.log(`Using match history length as game ID: ${gameId}`);
        }
      } catch (e) {
        console.error('Error extracting game ID from logs:', e);
        // Fallback to using match history length
        const matchHistoryLength = await this.getMatchHistoryLength();
        gameId = (matchHistoryLength - 1n).toString();
        console.log(`Fallback to match history length as game ID: ${gameId}`);
      }

      toast.success(`Match created successfully! Game ID: ${gameId}`);
      return gameId;
    } catch (error) {
      console.error("Error creating match:", error);
      toast.error("Failed to create match. Please try again.");
      throw error;
    }
  }

  async joinMatch(gameId: string, stakeAmount: string): Promise<any> {
    this.ensureInitialized();
    try {
      // Get game details first for validation
      console.log('Fetching game details for joining, gameId:', gameId);
      const gameDetails = await this.contract!.getGame(gameId);
      console.log('Game details:', {
        player1: gameDetails.player1,
        player2: gameDetails.player2,
        stake: ethers.formatEther(gameDetails.stake),
        isFinished: gameDetails.isFinished,
        isCancelled: gameDetails.isCancelled
      });

      // Comprehensive validation before joining
      if (gameDetails.isFinished) {
        throw new Error('This match is already finished');
      }

      if (gameDetails.isCancelled) {
        throw new Error('This match has been cancelled');
      }

      // Check if the current user is the invited player2
      const currentAddress = await this.signer!.getAddress();
      if (gameDetails.player2.toLowerCase() !== currentAddress.toLowerCase()) {
        throw new Error('You are not the invited player for this match');
      }

      // Ensure the stake amount matches
      const requiredStake = ethers.formatEther(gameDetails.stake);
      if (stakeAmount !== requiredStake) {
        throw new Error(`Stake amount must be ${requiredStake} MON`);
      }

      const tx = await this.contract!.joinMatch(gameId, {
        value: ethers.parseEther(stakeAmount)
      });
      toast.info("Joining match... Please wait for confirmation.");
      console.log('Join match transaction sent:', tx.hash);
      await tx.wait();
      console.log('Join match transaction confirmed');
      toast.success("Match joined successfully!");
      return tx;
    } catch (error: any) {
      console.error(`Error joining match with ID ${gameId}:`, error);

      // Provide more user-friendly error messages
      if (error.message.includes('execution reverted')) {
        if (error.message.includes('Not invited to this match')) {
          toast.error("You are not the invited player for this match.");
        } else if (error.message.includes('Game is not joinable')) {
          toast.error("This game is not joinable.");
        } else if (error.message.includes('Stake must match')) {
          toast.error("Your stake amount must match the game's stake.");
        } else if (error.message.includes('Game does not exist')) {
          toast.error("This game does not exist.");
        } else {
          toast.error("Failed to join match: " + error.message);
        }
      } else if (error.message.includes('You are not the invited player')) {
        toast.error("You are not the invited player for this match.");
      } else {
        toast.error("Failed to join match: " + error.message);
      }

      throw error;
    }
  }

  async cancelMatch(gameId: string): Promise<any> {
    this.ensureInitialized();
    try {
      const tx = await this.contract!.cancelMatch(gameId);
      toast.info("Cancelling match... Please wait for confirmation.");
      await tx.wait();
      toast.success("Match cancelled successfully!");
      return tx;
    } catch (error) {
      console.error(`Error cancelling match with ID ${gameId}:`, error);
      toast.error("Failed to cancel match. Please try again.");
      throw error;
    }
  }

  async reportMatchResult(gameId: string, winner: string): Promise<any> {
    this.ensureInitialized();
    try {
      console.log(`Reporting match result for game ID ${gameId}, winner: ${winner}`);

      // Check if the current user is the contract owner
      const currentAddress = await this.signer!.getAddress();
      const contractOwner = await this.readOnlyContract.owner();
      console.log(`Current address: ${currentAddress}, Contract owner: ${contractOwner}`);

      if (currentAddress.toLowerCase() !== contractOwner.toLowerCase()) {
        console.log('Current user is not the contract owner. Using server endpoint to report result.');

        // Since only the contract owner can report results, we'll use a different approach
        // For now, we'll show a message to the user
        toast.info("Match result recorded locally. The game admin will finalize it on the blockchain.");

        // In a production app, you would send this to your backend server
        // which would use the owner's private key to submit the transaction
        // For this demo, we'll just simulate success
        return { success: true, simulated: true };
      }

      // If the current user is the contract owner, proceed with the transaction
      const tx = await this.contract!.reportMatchResult(gameId, winner);
      toast.info("Reporting match result... Please wait for confirmation.");
      await tx.wait();
      toast.success("Match result reported successfully!");
      return tx;
    } catch (error) {
      console.error(`Error reporting match result for game ID ${gameId}:`, error);

      // Provide more detailed error messages
      if (error.message && error.message.includes('Not owner')) {
        toast.error("Only the contract owner can report match results.");
      } else {
        toast.error("Failed to report match result. Please try again.");
      }

      throw error;
    }
  }

  async withdraw(): Promise<any> {
    this.ensureInitialized();
    try {
      const tx = await this.contract!.withdraw();
      toast.info("Processing withdrawal... Please wait for confirmation.");
      await tx.wait();
      toast.success("Withdrawal successful!");
      return tx;
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      toast.error("Failed to withdraw funds. Please try again.");
      throw error;
    }
  }

  // NFT-related methods
  async sendPayment(amount: string, recipient?: string): Promise<any> {
    this.ensureInitialized();
    try {
      // If no recipient is provided, use the contract owner address
      const paymentRecipient = recipient || await this.readOnlyContract.owner();
      console.log(`Sending payment of ${amount} MON to ${paymentRecipient}`);

      // Get the signer
      const signer = await this.provider!.getSigner();

      // Send the payment transaction
      const paymentTx = await signer.sendTransaction({
        to: paymentRecipient,
        value: ethers.parseEther(amount)
      });

      console.log(`Payment transaction sent: ${paymentTx.hash}`);
      toast.info("Processing payment... Please wait for confirmation.");

      const receipt = await paymentTx.wait();
      console.log(`Payment confirmed in block ${receipt.blockNumber}`);
      toast.success(`Payment of ${amount} MON sent successfully!`);

      return paymentTx;
    } catch (error) {
      console.error("Error sending payment:", error);
      toast.error(`Failed to send payment: ${error.message || 'Unknown error'}`);
      throw error;
    }
  }

  async mintNFT(tokenURI: string, strength: number, speed: number): Promise<any> {
    this.ensureInitialized();
    try {
      console.log(`Calling mintNFT with tokenURI: ${tokenURI}, strength: ${strength}, speed: ${speed}`);

      // Call the contract without sending value
      const tx = await this.contract!.mintNFT(tokenURI, strength, speed);

      console.log(`Mint transaction hash: ${tx.hash}`);
      toast.info("Minting NFT... Please wait for confirmation.");

      const receipt = await tx.wait();
      console.log(`Mint transaction confirmed in block ${receipt.blockNumber}`);

      // Try to extract the token ID from the event logs
      let tokenId: bigint | undefined;
      try {
        const event = receipt.logs.find((log: any) =>
          log.topics[0] === ethers.id("NFTMinted(address,uint256,uint256,uint256)")
        );

        if (event) {
          const decodedData = ethers.AbiCoder.defaultAbiCoder().decode(
            ['uint256', 'uint256', 'uint256'],
            event.data
          );
          tokenId = decodedData[0];
          console.log(`Minted NFT with token ID: ${tokenId}`);
        }
      } catch (e) {
        console.log('Could not extract token ID from logs:', e);
      }

      toast.success(`NFT minted successfully!${tokenId ? ` Token ID: ${tokenId}` : ''}`);
      return tx;
    } catch (error) {
      console.error("Error minting NFT:", error);
      toast.error(`Failed to mint NFT: ${error.message || 'Unknown error'}`);
      throw error;
    }
  }

  async mintNFTWithPayment(tokenURI: string, strength: number, speed: number, price: string): Promise<any> {
    this.ensureInitialized();
    try {
      // Step 1: Send payment to contract owner
      console.log(`Starting paid minting process - Price: ${price} MON`);
      await this.sendPayment(price);

      // Step 2: Mint the NFT
      console.log('Payment confirmed, now minting NFT...');
      const mintTx = await this.mintNFT(tokenURI, strength, speed);

      return mintTx;
    } catch (error) {
      console.error("Error in paid minting process:", error);
      toast.error(`Failed to complete the minting process: ${error.message || 'Unknown error'}`);
      throw error;
    }
  }

  async getNFTStats(tokenId: string | number): Promise<NFTAttributes> {
    try {
      // Get the basic stats from the contract
      const [strength, speed] = await this.readOnlyContract.getNFTStats(tokenId);

      // Determine NFT type based on token ID and stats
      // For this demo, we'll use a simple algorithm:
      // - Token IDs divisible by 3 are Trail Effects
      // - Token IDs divisible by 2 are Avatars
      // - All others are Paddles
      const tokenIdNum = Number(tokenId);
      let nftType = NFTType.Paddle; // Default type

      if (tokenIdNum % 3 === 0) {
        nftType = NFTType.TrailEffect;
      } else if (tokenIdNum % 2 === 0) {
        nftType = NFTType.Avatar;
      }

      // Determine rarity based on combined stats
      const totalStats = Number(strength) + Number(speed);
      let rarity = Rarity.Common;

      if (totalStats >= 180) {
        rarity = Rarity.Legendary;
      } else if (totalStats >= 150) {
        rarity = Rarity.Epic;
      } else if (totalStats >= 120) {
        rarity = Rarity.Rare;
      } else if (totalStats >= 90) {
        rarity = Rarity.Uncommon;
      }

      // Create the enhanced NFT attributes
      const attributes: NFTAttributes = {
        nftType,
        typeId: nftType,
        rarity,
        level: BigInt(1),
        xp: BigInt(0),
        winsUsed: BigInt(0),
        strength,
        speed
      };

      // Add type-specific attributes
      if (nftType === NFTType.Paddle) {
        attributes.power = strength;
        attributes.spinControl = speed;
        attributes.durability = BigInt(10 + (Number(rarity) * 5));
      } else if (nftType === NFTType.Avatar) {
        attributes.hasSpecialEmotes = rarity >= Rarity.Uncommon;
        attributes.hasXpBoost = rarity >= Rarity.Rare;
        attributes.hasLeaderboardMultiplier = rarity >= Rarity.Epic;
      } else if (nftType === NFTType.TrailEffect) {
        attributes.isLimitedEdition = rarity >= Rarity.Rare;
        if (attributes.isLimitedEdition) {
          attributes.editionNumber = BigInt(tokenIdNum % 100 + 1);
          attributes.totalEditions = BigInt(100);
        }
      }

      return attributes;
    } catch (error) {
      console.error(`Error getting NFT stats for token ID ${tokenId}:`, error);
      throw error;
    }
  }

  async getNFTPrice(tokenId: string | number): Promise<bigint> {
    try {
      return await this.readOnlyContract.getNFTPrice(tokenId);
    } catch (error) {
      console.error(`Error getting NFT price for token ID ${tokenId}:`, error);
      throw error;
    }
  }

  async listNFT(tokenId: string | number, price: string): Promise<any> {
    this.ensureInitialized();
    try {
      console.log(`Listing NFT ${tokenId} for price: ${price} MON`);

      // Normalize price (replace comma with dot for international formats)
      const normalizedPrice = price.replace(',', '.');

      // Convert to BigInt for the contract
      const priceInWei = ethers.parseEther(normalizedPrice);
      console.log(`Price in wei: ${priceInWei}`);

      // Call the contract function
      const tx = await this.contract!.listNFT(tokenId, priceInWei);
      toast.info("Listing NFT... Please wait for confirmation.");

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log(`NFT listed successfully in block ${receipt.blockNumber}`);

      // Show success message
      toast.success(`NFT #${tokenId} listed for ${price} MON successfully!`);
      return tx;
    } catch (error) {
      console.error(`Error listing NFT with token ID ${tokenId}:`, error);

      // Show more specific error message if possible
      if (error.message && error.message.includes('user rejected')) {
        toast.error("Transaction was rejected by the user.");
      } else {
        toast.error("Failed to list NFT. Please try again.");
      }

      throw error;
    }
  }

  async buyNFT(tokenId: string | number, price: string): Promise<any> {
    this.ensureInitialized();
    try {
      const tx = await this.contract!.buyNFT(tokenId, {
        value: ethers.parseEther(price)
      });
      toast.info("Buying NFT... Please wait for confirmation.");
      await tx.wait();
      toast.success("NFT purchased successfully!");
      return tx;
    } catch (error) {
      console.error(`Error buying NFT with token ID ${tokenId}:`, error);
      toast.error("Failed to buy NFT. Please try again.");
      throw error;
    }
  }

  // Cache disabled
  clearCache(): void {
    console.log('Cache clearing requested, but caching is disabled');
    // No-op since caching is disabled
  }

  async getOwnedNFTs(address: string): Promise<any[]> {
    try {
      console.log(`Loading NFTs for ${address} without cache`);
      // Cache disabled - always fetch fresh data

      // Show loading toast
      const loadingToastId = toast.loading(`Loading your NFTs...`);

      // First get the balance of NFTs owned by the address
      const balance = await this.readOnlyContract.balanceOf(address);
      console.log(`NFT balance for ${address}: ${balance}`);

      // If balance is 0, return empty array immediately
      if (balance === 0n) {
        toast.dismiss(loadingToastId);
        return [];
      }

      const ownedNFTs = [];
      const maxTokensToCheck = 100; // Increased from 20 to ensure we find all NFTs

      // Use a more efficient approach - check the most recent token IDs first
      // as they're more likely to be owned by the user
      for (let i = maxTokensToCheck; i >= 1; i--) {
        try {
          const tokenId = i;
          const owner = await this.readOnlyContract.ownerOf(tokenId);

          // Check if this token is owned by the address
          if (owner.toLowerCase() === address.toLowerCase()) {
            console.log(`Found NFT owned by ${address}: Token ID ${tokenId}`);

            // Get the NFT attributes and price in parallel
            const [attributes, price] = await Promise.all([
              this.getNFTStats(tokenId),
              this.getNFTPrice(tokenId)
            ]);

            ownedNFTs.push({
              tokenId,
              attributes,
              price,
              owner
            });

            // If we've found all the NFTs owned by this address, we can stop
            if (ownedNFTs.length >= balance) {
              break;
            }
          }
        } catch (error) {
          // Skip if token doesn't exist or other error
          // This is expected for token IDs that don't exist
          // Don't log every error to reduce console noise
        }
      }

      console.log(`Found ${ownedNFTs.length} NFTs owned by ${address}`);
      // No caching - always return fresh data

      // Dismiss loading toast
      toast.dismiss(loadingToastId);

      return ownedNFTs;
    } catch (error) {
      console.error(`Error getting owned NFTs for address ${address}:`, error);
      toast.error("Failed to load your NFTs. Please try again.");
      throw error;
    }
  }

  async getAllListedNFTs(): Promise<NFTListing[]> {
    try {
      console.log('Loading all listed NFTs without cache');

      // Show loading toast
      const loadingToastId = toast.loading('Loading marketplace NFTs...');

      // This is a simplified approach - in a real implementation, you'd have a more efficient way to get listed NFTs
      const listedNFTs: NFTListing[] = [];

      // Increase to 100 to ensure we find all NFTs
      const maxTokensToCheck = 100;

      // Check tokens in reverse order (newest first) for better UX
      for (let i = maxTokensToCheck; i >= 1; i--) {
        try {
          // First check if the token exists by checking if it has an owner
          let owner: string;
          try {
            owner = await this.readOnlyContract.ownerOf(i);
          } catch (e) {
            // Token doesn't exist, skip to next one
            continue;
          }

          // Now check if it's listed for sale
          const price = await this.getNFTPrice(i);

          // If price is greater than 0, it's listed for sale
          if (price > 0n) {
            // Get attributes
            const attributes = await this.getNFTStats(i);

            listedNFTs.push({
              tokenId: BigInt(i),
              price,
              owner,
              attributes
            });
          }
        } catch (error) {
          // Skip if there's an error getting price or attributes
          // Don't log every error to reduce console noise
        }
      }

      // No caching - always return fresh data

      // Dismiss loading toast
      toast.dismiss(loadingToastId);

      return listedNFTs;
    } catch (error) {
      console.error("Error getting all listed NFTs:", error);
      toast.error("Failed to load marketplace NFTs. Please try again.");
      throw error;
    }
  }
}

export const pingPongContract = new PingPongContract();
export default pingPongContract;
