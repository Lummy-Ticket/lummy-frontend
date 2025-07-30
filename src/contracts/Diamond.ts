export const DIAMOND_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      {
        name: "diamondCut",
        type: "tuple[]",
        internalType: "struct IDiamondCut.FacetCut[]",
        components: [
          { name: "facetAddress", type: "address", internalType: "address" },
          {
            name: "action",
            type: "uint8",
            internalType: "enum IDiamondCut.FacetCutAction",
          },
          {
            name: "functionSelectors",
            type: "bytes4[]",
            internalType: "bytes4[]",
          },
        ],
      },
    ],
    stateMutability: "payable",
  },
  { type: "fallback", stateMutability: "payable" },
  { type: "receive", stateMutability: "payable" },
  {
    type: "event",
    name: "DiamondCut",
    inputs: [
      {
        name: "_diamondCut",
        type: "tuple[]",
        indexed: false,
        internalType: "struct IDiamondCut.FacetCut[]",
        components: [
          { name: "facetAddress", type: "address", internalType: "address" },
          {
            name: "action",
            type: "uint8",
            internalType: "enum IDiamondCut.FacetCutAction",
          },
          {
            name: "functionSelectors",
            type: "bytes4[]",
            internalType: "bytes4[]",
          },
        ],
      },
      {
        name: "_init",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "_calldata",
        type: "bytes",
        indexed: false,
        internalType: "bytes",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "CannotAddFunctionToDiamondThatAlreadyExists",
    inputs: [{ name: "selector", type: "bytes4", internalType: "bytes4" }],
  },
  {
    type: "error",
    name: "CannotAddSelectorsToZeroAddress",
    inputs: [{ name: "selectors", type: "bytes4[]", internalType: "bytes4[]" }],
  },
  {
    type: "error",
    name: "CannotRemoveFunctionThatDoesNotExist",
    inputs: [{ name: "selector", type: "bytes4", internalType: "bytes4" }],
  },
  {
    type: "error",
    name: "CannotRemoveImmutableFunction",
    inputs: [{ name: "selector", type: "bytes4", internalType: "bytes4" }],
  },
  {
    type: "error",
    name: "CannotReplaceFunctionThatDoesNotExists",
    inputs: [{ name: "selector", type: "bytes4", internalType: "bytes4" }],
  },
  {
    type: "error",
    name: "CannotReplaceFunctionWithTheSameFunctionFromTheSameFacet",
    inputs: [{ name: "selector", type: "bytes4", internalType: "bytes4" }],
  },
  {
    type: "error",
    name: "CannotReplaceFunctionsFromFacetWithZeroAddress",
    inputs: [{ name: "selectors", type: "bytes4[]", internalType: "bytes4[]" }],
  },
  {
    type: "error",
    name: "IncorrectFacetCutAction",
    inputs: [{ name: "action", type: "uint8", internalType: "uint8" }],
  },
  {
    type: "error",
    name: "InitializationFunctionReverted",
    inputs: [
      {
        name: "initializationContractAddress",
        type: "address",
        internalType: "address",
      },
      { name: "calldataParam", type: "bytes", internalType: "bytes" },
    ],
  },
  {
    type: "error",
    name: "NoBytecodeAtAddress",
    inputs: [
      { name: "facetAddress", type: "address", internalType: "address" },
      { name: "message", type: "string", internalType: "string" },
    ],
  },
  { type: "error", name: "NoSelectorsGivenToAdd", inputs: [] },
  {
    type: "error",
    name: "NoSelectorsProvidedForFacetForCut",
    inputs: [
      { name: "facetAddress", type: "address", internalType: "address" },
    ],
  },
  {
    type: "error",
    name: "RemoveFacetAddressMustBeZeroAddress",
    inputs: [
      { name: "facetAddress", type: "address", internalType: "address" },
    ],
  },
];
