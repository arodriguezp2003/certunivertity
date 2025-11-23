// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CertUniToken
 * @dev ERC20 token representing certificate issuance credits
 * 1 CertUni = 1 certificate that can be issued
 * Only the owner (backend wallet) can mint tokens
 */
contract CertUniToken is ERC20, Ownable {
    /**
     * @dev Constructor that sets the token name and symbol
     */
    constructor() ERC20("CertUni", "CERTUNI") Ownable(msg.sender) {}

    /**
     * @dev Mints tokens to a specific address
     * @param to The address that will receive the tokens
     * @param amountInWholeTokens The amount of whole tokens to mint (not wei)
     *
     * Only the contract owner can call this function
     * This is used by the backend to grant credits to universities
     */
    function mintFor(address to, uint256 amountInWholeTokens) external onlyOwner {
        require(to != address(0), "CertUniToken: cannot mint to zero address");
        require(amountInWholeTokens > 0, "CertUniToken: amount must be greater than zero");

        // Mint tokens (converting to wei with 18 decimals)
        _mint(to, amountInWholeTokens * 10**decimals());
    }

    /**
     * @dev Burns tokens from a specific address
     * @param from The address from which tokens will be burned
     * @param amountInWholeTokens The amount of whole tokens to burn
     *
     * Only the contract owner can call this function
     * This is used when a university issues a certificate
     */
    function burnFrom(address from, uint256 amountInWholeTokens) external onlyOwner {
        require(from != address(0), "CertUniToken: cannot burn from zero address");
        require(amountInWholeTokens > 0, "CertUniToken: amount must be greater than zero");

        uint256 amountInWei = amountInWholeTokens * 10**decimals();
        require(balanceOf(from) >= amountInWei, "CertUniToken: insufficient balance");

        // Burn tokens
        _burn(from, amountInWei);
    }

    /**
     * @dev Returns the balance of an address in whole tokens (not wei)
     * @param account The address to check
     * @return The balance in whole tokens
     */
    function balanceOfInWholeTokens(address account) external view returns (uint256) {
        return balanceOf(account) / 10**decimals();
    }
}
